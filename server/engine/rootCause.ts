import {
  SupervisoryFinding,
  RootCauseDiagnosis
} from '../types';

/**
 * FEATURE 9: ROOT CAUSE ANALYSIS & RECOMMENDATION TREE ENGINE
 * Diagnoses systemic organizational and technical root causes behind supervisory findings:
 * - Poor Governance
 * - Missing Detection Rules
 * - Weak Monitoring & Blind Spots
 * - Broken Sensors & Telemetry Loss
 * - Poor Analyst Training
 * - Alert Fatigue
 * - High Workload
 * - Missing Playbooks
 */

export function diagnoseRootCause(finding: SupervisoryFinding): RootCauseDiagnosis {
  const title = (finding.title + ' ' + finding.whatHappened + ' ' + finding.category).toLowerCase();

  if (title.includes('escalation') || title.includes('ac-04') || title.includes('bypassed')) {
    return {
      category: 'Missing Playbooks',
      confidence: 94,
      evidencePoints: [
        'Critical incident escalated directly to closure without Tier-2 commander handshake',
        'Lack of formal trigger threshold in ticketing SOAR orchestration rules',
        'Absence of secondary sign-off requirement on high-severity containment actions'
      ],
      recommendationTree: {
        immediateStep: 'Implement mandatory blocking validation gate in ticketing workflow preventing closure of Critical tickets without documented Tier-2 sign-off.',
        systemicFix: 'Conduct comprehensive audit of Incident Response SOPs and integrate automated SOAR playbooks linking severity to multi-tier escalation.',
        regulatoryMandateRef: 'NCIIPC Framework Sec 4.3 (Incident Escalation Protocols) & CERT-In Mandatory Directions Rule 6'
      }
    };
  }

  if (title.includes('premature') || title.includes('rapid') || title.includes('minutes') || title.includes('shortcut')) {
    return {
      category: 'Alert Fatigue',
      confidence: 89,
      evidencePoints: [
        'Abnormally short investigation duration (<8 minutes) on critical alert',
        'High alert ingestion rate causing analyst triage pressure',
        'Superficial note documentation matching boilerplate dismissal template'
      ],
      recommendationTree: {
        immediateStep: 'Perform quality assurance re-examination of all cases closed in under 10 minutes over the last 30 days.',
        systemicFix: 'Tune SIEM alert thresholding and deploy alert deduplication algorithms to reduce noise and prevent analyst volume exhaustion.',
        regulatoryMandateRef: 'NCIIPC Operational Discipline Guidelines & ISO/IEC 27035 Sec 8.2'
      }
    };
  }

  if (title.includes('sla') || title.includes('stagnation') || title.includes('delay')) {
    return {
      category: 'High Workload',
      confidence: 86,
      evidencePoints: [
        'Investigation duration exceeded mandated SLA threshold by 40%+',
        'Cross-shift triage handovers lacking formalized status documentation',
        'Analyst-to-active-case ratio exceeds recommended supervisory threshold'
      ],
      recommendationTree: {
        immediateStep: 'Reassign unassigned stagnant queue tickets to senior incident handlers.',
        systemicFix: 'Adjust shift staffing models to match peak threat ingestion windows and introduce automatic SLA timer escalation warnings at 75% elapsed duration.',
        regulatoryMandateRef: 'NCIIPC Capacity Management Framework & CERT-In Cyber Security Guidelines Sec 7'
      }
    };
  }

  if (title.includes('evidence') || title.includes('artifact') || title.includes('pcap') || title.includes('hash')) {
    return {
      category: 'Poor Analyst Training',
      confidence: 88,
      evidencePoints: [
        'No digital forensic artifacts, log hashes, or network captures attached to case',
        'Analyst documentation lacks verifiable IOC (Indicator of Compromise) references',
        'Closure recorded without forensic validation checklist compliance'
      ],
      recommendationTree: {
        immediateStep: 'Mandate digital forensics attachment checklist for all tier 1 and tier 2 closures.',
        systemicFix: 'Provide hands-on evidence acquisition training (PCAP carving, memory artifacts, hash verification) and enforce automated repository linkage.',
        regulatoryMandateRef: 'NCIIPC Technical Guidelines for Evidence Handling & IT Act 2000 Sec 79A'
      }
    };
  }

  if (title.includes('negative space') || title.includes('missing') || title.includes('silent') || title.includes('sensor')) {
    return {
      category: 'Weak Monitoring',
      confidence: 92,
      evidencePoints: [
        'Zero telemetry received from critical CII subnets during observation period',
        'Disparity between expected attack vector logging and ingested alert categories',
        'Potential log forwarder outage or misconfigured syslog destination'
      ],
      recommendationTree: {
        immediateStep: 'Verify operational heartbeat of syslog agents and endpoint telemetry forwarders on all critical infrastructure subnets.',
        systemicFix: 'Deploy continuous synthetic sensor health monitoring and automated alerts for unexpected telemetry silence.',
        regulatoryMandateRef: 'NCIIPC Telemetry Assurance Standard & CERT-In Rule 5 (Log Maintenance and Retention)'
      }
    };
  }

  // Default fallback: Poor Governance
  return {
    category: 'Poor Governance',
    confidence: 82,
    evidencePoints: [
      'Operational drift identified across multiple successive assessment cycles',
      'Supervisory review queue backlog exceeds established thresholds',
      'Lack of independent SOC audit and internal compliance validation'
    ],
    recommendationTree: {
      immediateStep: 'Conduct monthly supervisory oversight briefings with entity CISO and SOC Manager.',
      systemicFix: 'Establish a formalized Governance, Risk, and Compliance (GRC) continuous monitoring matrix with automated key risk indicators (KRIs).',
      regulatoryMandateRef: 'NCIIPC CII Cybersecurity Governance Directive 2024'
    }
  };
}
