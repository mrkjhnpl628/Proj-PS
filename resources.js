/* resources.js - extra learning media per topic (video, image, links).
   To add a YouTube video: paste the 11-character ID after "v=" into `vid`. */
const yt=q=>['Search YouTube: '+q,'https://www.youtube.com/results?search_query='+encodeURIComponent(q)];
const L={
 nist:['NIST Computer Security Resource Center Glossary','https://csrc.nist.gov/glossary'],
 csf:['NIST Cybersecurity Framework','https://www.nist.gov/cyberframework'],
 sow:['CISA: Secure Our World','https://www.cisa.gov/secure-our-world'],
 mfa:['CISA: Multifactor Authentication','https://www.cisa.gov/MFA'],
 phish:['CISA: Recognize and Report Phishing','https://www.cisa.gov/secure-our-world/recognize-and-report-phishing'],
 hibp:['Have I Been Pwned (check for breached accounts)','https://haveibeenpwned.com/'],
 gdpr:['GDPR overview','https://gdpr.eu/'],
 r30:['NIST SP 800-30: Guide for Conducting Risk Assessments','https://csrc.nist.gov/pubs/sp/800/30/r1/final'],
 v125:['NIST SP 800-125: Guide to Security for Full Virtualization','https://csrc.nist.gov/pubs/sp/800/125/final'],
 cis:['CIS Benchmarks (hardening guides)','https://www.cisecurity.org/cis-benchmarks'],
 ms:['Microsoft Learn: Windows security documentation','https://learn.microsoft.com/en-us/windows/security/'],
 msrc:['Microsoft Security Update Guide','https://msrc.microsoft.com/update-guide'],
 boot:['Professor Messer: Boot Integrity (Secure Boot, TPM, measured boot)','https://www.professormesser.com/security-plus/sy0-601/sy0-601-video/boot-integrity/'],
 uefi:['UEFI Forum','https://uefi.org/'],
 tcg:['Trusted Computing Group (TPM specifications)','https://trustedcomputinggroup.org/'],
 and:['Android Open Source Project: Security','https://source.android.com/docs/security'],
 apl:['Apple Platform Security guide','https://support.apple.com/guide/security/welcome/web'],
 owasp:['OWASP Foundation','https://owasp.org/'],
 cve:['CVE Program (public vulnerability IDs)','https://www.cve.org/']
};
const RES={
 s1:{img:'images/defense-layers.svg',alt:'Six layers of platform security from physical to data',cap:'Platform security is applied in layers.',vid:'gx0vlRpdFnc',vt:'Introduction to computer security and the CIA triad',links:[L.nist,L.csf,L.sow]},
 s2:{img:'images/defense-layers.svg',alt:'Six layers of platform security from physical to data',cap:'Each layer needs its own controls.',links:[L.ms,L.and,L.apl,yt('defense in depth layers of security explained')]},
 s3:{img:'images/cia-triad.svg',alt:'CIA triad: confidentiality, integrity and availability around data',cap:'The CIA triad is the foundation of cybersecurity.',vid:'SBcDGb9l6yo',vt:'The CIA Triad (Professor Messer, Security+ SY0-701)',links:[L.nist,L.csf]},
 s4:{img:'images/mfa-factors.svg',alt:'Three authentication factors: know, have, are',cap:'MFA combines different factor types.',links:[L.mfa,L.hibp,yt('multi-factor authentication explained')]},
 s5:{links:[L.gdpr,L.nist,yt('digital signatures and non-repudiation explained')]},
 s6:{img:'images/risk-matrix.svg',alt:'Risk matrix of likelihood against impact',cap:'Risk is ranked by likelihood and impact.',links:[L.r30,L.csf,yt('cybersecurity risk assessment explained')]},
 s7:{img:'images/chain-of-trust.svg',alt:'Chain of trust from TPM to drivers and apps',cap:'Each boot stage verifies the next.',links:[L.boot,L.tcg,L.uefi,yt('TPM Secure Boot chain of trust explained')]},
 s8:{links:[L.v125,L.cis,yt('hypervisor type 1 vs type 2 explained')]},
 s9:{links:[L.ms,L.cis,L.msrc,yt('Windows UAC Defender firewall explained')]},
 c2t0:{links:[L.ms,yt('Windows UAC and BitLocker explained')]},
 c2t1:{links:[L.ms,yt('Windows Defender Firewall profiles explained')]},
 c3t0:{links:[L.v125,yt('shared responsibility model cloud security explained')]},
 c3t1:{links:[L.v125,L.cis]},
 c4t0:{img:'images/mfa-factors.svg',alt:'Three authentication factors: know, have, are',cap:'Strong passwords plus another factor.',links:[L.hibp,L.sow,yt('password manager and passphrases explained')]},
 c4t1:{links:[L.phish,L.mfa,yt('how to spot a phishing email')]},
 c5t0:{img:'images/chain-of-trust.svg',alt:'Chain of trust from TPM to drivers and apps',cap:'Secure Boot and measured boot extend the chain.',links:[L.boot,L.uefi]},
 c5t1:{links:[L.uefi,L.tcg,yt('UEFI firmware security explained')]},
 c6t0:{img:'images/risk-matrix.svg',alt:'Risk matrix of likelihood against impact',cap:'Prioritize high-likelihood, high-impact risks.',links:[L.r30,L.csf]},
 c6t1:{img:'images/defense-layers.svg',alt:'Six layers of platform security from physical to data',cap:'Layered controls cover each other\'s gaps.',links:[L.csf,L.cis]},
 c7t0:{links:[L.and,L.apl,L.owasp]},
 c7t1:{links:[L.and,L.apl,yt('mobile device security best practices')]},
 c8t0:{links:[L.cve,L.nist,yt('zero-day vulnerability explained')]},
 c8t1:{links:[L.msrc,L.cis,yt('Patch Tuesday and patch management explained')]}
};
