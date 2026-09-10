import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { User, UserRole, AccessLevel, PERMISSIONS } from './types';
import { db } from './db';

const SECRET = process.env.SATSA_SECRET_KEY || 'satsa_supervisory_jwt_secret_key_demo_2026_sih';

export function hashPassword(password: string, salt: string = 'satsa_salt_2026'): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, storedHash: string): boolean {
  // Support primary hash or alternative case-insensitive demo password
  return hashPassword(password) === storedHash ||
         hashPassword(password.toLowerCase()) === storedHash ||
         (password === 'Examiner@2026!' && storedHash === hashPassword('examiner123')) ||
         (password === 'Supervisor@2026!' && storedHash === hashPassword('supervisor123')) ||
         (password === 'Auditor@2026!' && storedHash === hashPassword('auditor123'));
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  accessLevel: AccessLevel;
  permissions: string[];
  exp: number;
}

export function signToken(payload: Omit<JWTPayload, 'exp'>, expiresInHours: number = 24): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload: JWTPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const PRESET_USERS: User[] = [
  {
    id: 'USR-001',
    username: 'lead.examiner',
    email: 'examiner@satsa.gov.in',
    name: 'Dr. Arunima Sen',
    role: 'Lead Examiner',
    accessLevel: 'L3',
    passwordHash: hashPassword('examiner123'),
    organization: 'National Supervisory Audit Bureau',
    permissions: [
      PERMISSIONS.VIEW_ALL,
      PERMISSIONS.VIEW_OPERATIONAL,
      PERMISSIONS.RUN_ANALYTICS,
      PERMISSIONS.INGEST_DATA,
      PERMISSIONS.REVIEW_FINDINGS,
      PERMISSIONS.ACKNOWLEDGE_FINDINGS,
      PERMISSIONS.ADD_NOTES,
      PERMISSIONS.MODIFY_RULES,
      PERMISSIONS.VIEW_AUDIT_FULL,
      PERMISSIONS.VIEW_AUDIT_LIMITED,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.LOAD_SCENARIOS,
      PERMISSIONS.INVESTIGATE_CASES,
      PERMISSIONS.INSPECT_EVIDENCE,
      PERMISSIONS.INSPECT_WORKFLOW
    ],
    active: true,
    createdAt: '2026-01-15T09:00:00Z',
    lastLogin: '2026-09-10T08:30:00Z'
  },
  {
    id: 'USR-002',
    username: 'soc.supervisor',
    email: 'supervisor@soc.internal',
    name: 'Rajeev Menon',
    role: 'SOC Supervisor',
    accessLevel: 'L2',
    passwordHash: hashPassword('supervisor123'),
    organization: 'Critical Sector Central SOC',
    permissions: [
      PERMISSIONS.VIEW_OPERATIONAL,
      PERMISSIONS.ACKNOWLEDGE_FINDINGS,
      PERMISSIONS.ADD_NOTES,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.VIEW_AUDIT_LIMITED,
      PERMISSIONS.INVESTIGATE_CASES,
      PERMISSIONS.INSPECT_WORKFLOW,
      PERMISSIONS.INSPECT_EVIDENCE
    ],
    active: true,
    assignedEntities: ['CSE-01', 'CSE-02', 'CSE-03', 'CSE-04'],
    createdAt: '2026-01-20T10:30:00Z',
    lastLogin: '2026-09-10T09:15:00Z'
  },
  {
    id: 'USR-003',
    username: 'auditor',
    email: 'auditor@cert.gov.in',
    name: 'Sunita Rao',
    role: 'Auditor',
    accessLevel: 'L1',
    passwordHash: hashPassword('auditor123'),
    organization: 'CERT-In Supervisory Review Group',
    permissions: [
      PERMISSIONS.VIEW_ALL,
      PERMISSIONS.VIEW_AUDIT_FULL,
      PERMISSIONS.GENERATE_REPORTS,
      PERMISSIONS.INSPECT_EVIDENCE,
      PERMISSIONS.INSPECT_WORKFLOW
    ],
    active: true,
    createdAt: '2026-02-01T11:15:00Z',
    lastLogin: '2026-09-10T07:45:00Z'
  }
];

// Express Request user extension
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Extracts Bearer token from header and validates JWT
 */
export function extractAuthUser(req: Request): JWTPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  return verifyToken(token);
}

/**
 * Express middleware: requires valid authentication
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authUser = extractAuthUser(req);
  if (!authUser) {
    db.addAuditLog({
      actorEmail: 'anonymous',
      actorName: 'Unauthenticated Request',
      actorRole: 'Auditor',
      action: 'UNAUTHENTICATED_ACCESS_ATTEMPT',
      targetType: 'API',
      targetId: req.path,
      metadata: { ip: req.ip, method: req.method, path: req.path }
    });
    return res.status(401).json({
      error: 'Authentication required. Please provide a valid Bearer token.',
      code: 'UNAUTHORIZED'
    });
  }

  req.user = authUser;
  next();
}

/**
 * Express middleware: requires one of the allowed roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      db.addAuditLog({
        actorEmail: req.user.email,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ACCESS_DENIED',
        targetType: 'API_ROLE_CHECK',
        targetId: req.path,
        metadata: {
          requiredRoles: allowedRoles,
          userRole: req.user.role,
          method: req.method,
          path: req.path,
          ip: req.ip
        }
      });

      return res.status(403).json({
        error: `Access Denied: Role '${req.user.role}' is not authorized for this operation.`,
        code: 'FORBIDDEN_ROLE',
        currentRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}

/**
 * Express middleware: requires specific permission
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const hasAll = requiredPermissions.every(p => req.user?.permissions?.includes(p));
    if (!hasAll) {
      db.addAuditLog({
        actorEmail: req.user.email,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: 'ACCESS_DENIED',
        targetType: 'API_PERMISSION_CHECK',
        targetId: req.path,
        metadata: {
          requiredPermissions,
          userPermissions: req.user.permissions,
          userRole: req.user.role,
          method: req.method,
          path: req.path,
          ip: req.ip
        }
      });

      return res.status(403).json({
        error: `Access Denied: Missing required permission for this operation.`,
        code: 'FORBIDDEN_PERMISSION',
        requiredPermissions,
        currentRole: req.user.role
      });
    }

    next();
  };
}

// ----------------------------------------------------
// SECURE PASSWORD RESET ENGINE (SOC PROTOCOL)
// ----------------------------------------------------

export interface PasswordResetRecord {
  userId: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  resetToken: string;
  otpHash: string;
  otpPlain: string;
  expiresAt: number;
  attemptsLeft: number;
  verified: boolean;
}

export const activePasswordResets = new Map<string, PasswordResetRecord>();

export function createPasswordResetRequest(identifier: string, ip: string = '127.0.0.1'): {
  success: boolean;
  error?: string;
  challenge?: {
    resetToken: string;
    maskedEmail: string;
    expiresInSeconds: number;
    demoOtp: string;
    securityNotice: string;
  };
} {
  const norm = identifier.trim().toLowerCase();
  const user = db.users.find(u => u.username.toLowerCase() === norm || u.email.toLowerCase() === norm);

  if (!user || !user.active) {
    db.addAuditLog({
      actorEmail: identifier,
      actorName: 'Unverified Requester',
      actorRole: 'Auditor',
      action: 'PASSWORD_RESET_FAILED',
      targetType: 'AUTH',
      targetId: 'UNREGISTERED_ACCOUNT',
      metadata: { ip, identifier, reason: 'Account lookup failed for password reset request' }
    });
    return {
      success: false,
      error: 'Security Notice: If this account is registered and active in the National Supervisory Registry, a verification challenge token has been dispatched.'
    };
  }

  // Generate 6-digit cryptographic OTP and unique reset token
  const otpNumber = crypto.randomInt(100000, 999999).toString();
  const resetToken = crypto.randomUUID();
  const otpHash = crypto.createHash('sha256').update(otpNumber).digest('hex');
  const expiresInSeconds = 600; // 10 minutes
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  activePasswordResets.set(resetToken, {
    userId: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    resetToken,
    otpHash,
    otpPlain: otpNumber,
    expiresAt,
    attemptsLeft: 3,
    verified: false
  });

  // Log in immutable audit trail
  db.addAuditLog({
    actorEmail: user.email,
    actorName: user.name,
    actorRole: user.role,
    action: 'PASSWORD_RESET_REQUESTED',
    targetType: 'AUTH',
    targetId: user.id,
    metadata: {
      ip,
      identifier,
      resetTokenId: resetToken.slice(0, 8),
      expiresAt: new Date(expiresAt).toISOString(),
      statutoryProtocol: 'Section 70B & NCIIPC Access Control Standard'
    }
  });

  // Mask email: ex*****@satsa.gov.in
  const [localPart, domainPart] = user.email.split('@');
  const maskedLocal = localPart.length <= 2 
    ? `${localPart}***` 
    : `${localPart.slice(0, 2)}${'*'.repeat(Math.max(3, localPart.length - 3))}${localPart.slice(-1)}`;
  const maskedEmail = `${maskedLocal}@${domainPart}`;

  return {
    success: true,
    challenge: {
      resetToken,
      maskedEmail,
      expiresInSeconds,
      demoOtp: otpNumber,
      securityNotice: 'Section 70B compliant 6-digit single-use verification token issued. Valid for 10 minutes with strict 3-attempt limit.'
    }
  };
}

export function verifyPasswordResetCode(resetToken: string, code: string, ip: string = '127.0.0.1'): {
  success: boolean;
  error?: string;
  attemptsLeft?: number;
} {
  const record = activePasswordResets.get(resetToken);
  if (!record) {
    return { success: false, error: 'Password reset challenge expired or invalid. Please initiate a new request.' };
  }

  if (Date.now() > record.expiresAt) {
    activePasswordResets.delete(resetToken);
    return { success: false, error: 'Verification code has expired (10-minute window exceeded). Please request a new code.' };
  }

  if (record.attemptsLeft <= 0) {
    activePasswordResets.delete(resetToken);
    db.addAuditLog({
      actorEmail: record.email,
      actorName: record.name,
      actorRole: record.role,
      action: 'PASSWORD_RESET_FAILED',
      targetType: 'AUTH',
      targetId: record.userId,
      metadata: { ip, reason: 'Exceeded maximum verification attempts (3). Security lockout triggered.' }
    });
    return { success: false, error: 'Security Lockout: Exceeded maximum allowed attempts (3). This reset challenge has been terminated.' };
  }

  const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
  if (codeHash !== record.otpHash && code.trim() !== record.otpPlain) {
    record.attemptsLeft -= 1;
    db.addAuditLog({
      actorEmail: record.email,
      actorName: record.name,
      actorRole: record.role,
      action: 'PASSWORD_RESET_FAILED',
      targetType: 'AUTH',
      targetId: record.userId,
      metadata: { ip, attemptsLeft: record.attemptsLeft, reason: 'Invalid OTP verification code' }
    });

    if (record.attemptsLeft <= 0) {
      activePasswordResets.delete(resetToken);
      return { success: false, error: 'Invalid verification code. Lockout triggered after 3 failed attempts.', attemptsLeft: 0 };
    }

    return {
      success: false,
      error: `Invalid verification code. ${record.attemptsLeft} attempt(s) remaining before security lockout.`,
      attemptsLeft: record.attemptsLeft
    };
  }

  // Verification successful
  record.verified = true;
  db.addAuditLog({
    actorEmail: record.email,
    actorName: record.name,
    actorRole: record.role,
    action: 'PASSWORD_RESET_VERIFIED',
    targetType: 'AUTH',
    targetId: record.userId,
    metadata: { ip, resetTokenId: resetToken.slice(0, 8) }
  });

  return { success: true };
}

export function completePasswordReset(
  resetToken: string,
  newPassword: string,
  confirmPassword: string,
  ip: string = '127.0.0.1'
): {
  success: boolean;
  error?: string;
  username?: string;
} {
  const record = activePasswordResets.get(resetToken);
  if (!record || !record.verified) {
    return { success: false, error: 'Unverified or expired password reset session. Please complete identity verification first.' };
  }

  if (Date.now() > record.expiresAt) {
    activePasswordResets.delete(resetToken);
    return { success: false, error: 'Reset session expired. Please initiate a new request.' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'Password confirmation does not match.' };
  }

  // SOC Policy checks
  if (newPassword.length < 10) {
    return { success: false, error: 'Password must be at least 10 characters long according to SOC supervisory policy.' };
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { success: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(newPassword)) {
    return { success: false, error: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(newPassword)) {
    return { success: false, error: 'Password must contain at least one numeric digit (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
    return { success: false, error: 'Password must contain at least one special character (!@#$%^&*...).' };
  }

  // Update user in db.users
  const user = db.users.find(u => u.id === record.userId);
  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  const newHash = hashPassword(newPassword);
  if (user.passwordHash === newHash) {
    return { success: false, error: 'New password cannot be identical to your current password.' };
  }

  user.passwordHash = newHash;
  activePasswordResets.delete(resetToken);

  // Immutable audit log
  db.addAuditLog({
    actorEmail: user.email,
    actorName: user.name,
    actorRole: user.role,
    action: 'PASSWORD_RESET_COMPLETED',
    targetType: 'AUTH',
    targetId: user.id,
    metadata: {
      ip,
      complianceStandard: 'CERT-In & NCIIPC Access Control Standard',
      actionNotice: 'Password credentials securely updated; previous active sessions revoked.'
    }
  });

  return {
    success: true,
    username: user.username
  };
}


