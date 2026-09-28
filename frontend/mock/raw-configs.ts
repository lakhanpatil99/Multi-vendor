/**
 * Signature raw configurations for each vendor syntax style.
 * Credentials/secrets are PRE-MASKED — ANCP never displays raw credentials.
 * These strings feed the configuration viewer and evidence highlighting.
 */

/** Cisco IOS — FLAT / command-oriented. Contains intentional weaknesses. */
export const CISCO_IOS_CONFIG = `!
! Last configuration change at 09:12:44 UTC Mon Sep 21 2026
!
version 15.7
service timestamps debug datetime msec
service timestamps log datetime msec
no service password-encryption
!
hostname CORE-RTR-01
!
enable secret 5 ********
!
username admin privilege 15 password 7 ********
!
no aaa new-model
!
ip domain-name corp.example.net
!
line con 0
 exec-timeout 0 0
 logging synchronous
line vty 0 4
 transport input telnet ssh
 exec-timeout 30 0
 login local
line vty 5 15
 transport input telnet ssh
 login local
!
ip ssh version 1
!
snmp-server community public RO
snmp-server community private RW
!
no logging buffered
no service timestamps
!
ntp server 0.0.0.0
!
access-list 10 permit any
!
interface GigabitEthernet0/0
 description WAN-UPLINK
 ip address 203.0.113.2 255.255.255.252
 no ip access-group in
!
banner motd ^C Unauthorized access prohibited ^C
!
end`;

/** Juniper Junos — HIERARCHICAL. */
export const JUNIPER_JUNOS_CONFIG = `## Last commit: 2026-09-20 22:41:03 UTC by netops
system {
    host-name EDGE-FW-JUN-02;
    root-authentication {
        encrypted-password "********"; ## SECRET-DATA
    }
    login {
        user admin {
            uid 2000;
            class super-user;
            authentication {
                encrypted-password "********"; ## SECRET-DATA
            }
        }
    }
    services {
        ssh {
            protocol-version v2;
            root-login deny;
        }
        telnet;
    }
    syslog {
        user * {
            any emergency;
        }
        file messages {
            any notice;
        }
    }
    ntp {
        server 192.0.2.10;
    }
}
snmp {
    community public {
        authorization read-only;
    }
}
security {
    policies {
        from-zone trust to-zone untrust {
            policy allow-all {
                match {
                    source-address any;
                    destination-address any;
                    application any;
                }
                then {
                    permit;
                }
            }
        }
    }
}`;

/** FortiOS — BLOCK-based. */
export const FORTIOS_CONFIG = `#config-version=FGT60F-7.2.4
config system global
    set hostname "PERIM-FGT-03"
    set admin-ssh-v1 enable
    set admintimeout 480
    set gui-theme "neutrino"
end
config system admin
    edit "admin"
        set accprofile "super_admin"
        set password ENC ********
    next
end
config system interface
    edit "wan1"
        set ip 198.51.100.4 255.255.255.0
        set allowaccess ping https ssh telnet http
    next
end
config log setting
    set local-in-allow disable
end
config system snmp community
    edit 1
        set name "public"
        set status enable
    next
end
config system ntp
    set ntpsync disable
end
config firewall policy
    edit 1
        set name "any-any-allow"
        set srcintf "wan1"
        set dstintf "internal"
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set service "ALL"
    next
end`;

/** A compliant reference snippet used for expected-state comparisons. */
export const CISCO_HARDENED_SNIPPET = `aaa new-model
ip ssh version 2
line vty 0 4
 transport input ssh
 exec-timeout 5 0
logging buffered 32768 informational
ntp server 192.0.2.10 key 1
snmp-server group READONLY v3 priv`;
