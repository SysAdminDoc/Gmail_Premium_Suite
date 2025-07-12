// ==UserScript==
// @name         Gmail Premium UI Suite
// @namespace    https://github.com/SysAdminDoc/MailPro-Enhancement-Suite
// @version      6.3
// @description  The ultimate Gmail revamp. Features a dynamic JS-based chat collapse, "nuclear" reply header removal, plus advanced signature hiding and UI tools.
// @author       Matthew Parker
// @match        https://mail.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @downloadURL  https://raw.githubusercontent.com/SysAdminDoc/MailPro-Enhancement-Suite/main/Gmail%20Premium%20UI%20Suite.user.js
// @updateURL    https://raw.githubusercontent.com/SysAdminDoc/MailPro-Enhancement-Suite/main/Gmail%20Premium%20UI%20Suite.meta.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ——————————————————————————————————————————————————————————————————————————
    //  ~ V6.3 UPDATES ~
    //
    //  1. Added Dark Chat Roster:
    //     - Integrated dark styling for the chat roster and iframe container.
    //     - This is now part of the main "Enable Gmail Dark Mode" feature
    //       and not a separate toggle.
    //
    // ——————————————————————————————————————————————————————————————————————————


    // —————————————————————
    // 0. DYNAMIC CONTENT HIDING ENGINE
    // —————————————————————
    let dynamicHidingObserver = null;
    const activeHidingRules = new Map();

    const observerCallback = (mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Process only element nodes
                        for (const rule of activeHidingRules.values()) {
                            try {
                                rule(node);
                            } catch (e) {
                                console.error('[Gmail Premium] Error applying hiding rule:', e);
                            }
                        }
                    }
                });
            }
        }
    };

    function startObserver() {
        if (dynamicHidingObserver) return;
        dynamicHidingObserver = new MutationObserver(observerCallback);
        dynamicHidingObserver.observe(document.body, { childList: true, subtree: true });
    }

    function stopObserver() {
        if (dynamicHidingObserver) {
            dynamicHidingObserver.disconnect();
            dynamicHidingObserver = null;
        }
    }

    function addHidingRule(id, ruleFn) {
        activeHidingRules.set(id, ruleFn);
        if (activeHidingRules.size === 1) {
            startObserver();
        }
        ruleFn(document.body);
    }

    function removeHidingRule(id) {
        activeHidingRules.delete(id);
        if (activeHidingRules.size === 0) {
            stopObserver();
        }
        // General cleanup for elements hidden by this rule
        document.querySelectorAll(`[data-gm-hidden-by="${id}"]`).forEach(el => {
            el.style.display = '';
            el.removeAttribute('data-gm-hidden-by');
        });
    }


    // —————————————————————
    // 1. SETTINGS MANAGER
    // —————————————————————
    const settingsManager = {
        defaults: {
            // UI & Visuals
            settingsButton: true,
            glowingStarred: true,
            squarifyTheme: false,
            animatedCompose: true,
            animatedStars: true,
            styleDateTime: true,

            // Themes
            gmailDarkMode: false,

            // Layout
            customCSS: true,
            styleReplyButton: true,
            composeRecipientBorder: true,
            collapseChatSidebar: true,
            hideChatWithHoverLip: false,

            // Productivity
            showEmail: true,
            fmtToolbar: true,
            uiTweaks: true,
            contactChipDoubleClick: true,

            // Header Elements
            hideAppsGrid: false,
            hideProfileBox: false,
            hideTopBarSupport: false,
            hideTopBarSettings: false,

            // Hubspot
            hubspotActivityIndicator: false,
            hideHubspotControls: false,
            hideHubspotLogTracker: false,
            hideHubspotProfileButton: false,
            hideHubspotContactIcon: false,

            // AI & Tools
            hideGeminiHelpMeWrite: false,
            hideAskGemini: false,
            hideLoomButton: true,
            hideSummarizeEmail: true,
            hideSmartFeaturesBanner: true,

            // Declutter
            hideOrgWarnings: true,
            hideMiscClutter: false,
            hideEmailLabels: false,
            hideLabelsSection: false,
            hideDiscoverMore: false,
            hideProfilePicture: false,
            hideEverythingElseHeader: false,
            hideStarredHeader: false,
            hideSubjectToolbar: false,

            // Email Thread Declutter
            nukeReplyMetadata: true,
            nukeReplyMetadataSimple: false,
            nukeReplyMetadataShowCc: false,
            nukeReplyMetadataShowBcc: false,
            hideReactionButton: true,
            hideAllSignaturesInChain: true,
        },
        async load() {
            let savedSettings = await GM_getValue('gmPremiumSettings', {});
            // Clean up old settings from previous versions
            const oldKeys = ['hideReplyHeaders', 'hideSignaturesInReplies', 'hideDeviceSignatures', 'hideOutlookMobileSignature', 'hideReplyForwardMetadata', 'hideExternalSignatures', 'hideMySignatureInChains', 'mySignatureKeywords', 'themeToggle', 'darkLoadingScreen'];
            oldKeys.forEach(key => {
                if (savedSettings.hasOwnProperty(key)) {
                    delete savedSettings[key];
                }
            });
            return { ...this.defaults, ...savedSettings };
        },
        async save(settings) {
            await GM_setValue('gmPremiumSettings', settings);
        },
        async getFirstRunStatus() {
            return await GM_getValue('hasRunBefore', false);
        },
        async setFirstRunStatus(hasRun) {
            await GM_setValue('hasRunBefore', hasRun);
        }
    };


    // —————————————————————
    // 2. FEATURE DEFINITIONS
    // —————————————————————
    const features = [
        // Group: UI & Visuals
        {
            id: 'settingsButton',
            name: 'Floating Settings Button',
            description: 'Shows a floating gear icon to open the settings panel.',
            group: 'UI & Visuals',
            _element: null,
            init() {
                const btn = document.createElement('button');
                btn.id = 'gm-floating-settings-btn';
                btn.title = 'Open Gmail Premium Settings';
                btn.appendChild(createCogSvg());
                btn.onclick = () => document.body.classList.toggle('gm-panel-open');
                document.body.appendChild(btn);
                this._element = btn;
            },
            destroy() {
                this._element?.remove();
            }
        }, {
            id: 'glowingStarred',
            name: 'Glowing Starred Section',
            description: 'Adds a subtle glow effect to the "Starred" email section in your inbox.',
            group: 'UI & Visuals',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-glowing-starred';
                this._styleElement.textContent = `
              div.ae4:has(span.qh[title="Starred"]),
              div.ae4:has(span.qh:contains("Starred")) {
                 box-shadow: 0 0 12px 2px rgba(250, 215, 60, 0.7) !important;
                 border: 1px solid rgba(250, 215, 60, 0.8) !important;
                 border-radius: 8px !important;
                 margin-bottom: 10px !important;
              }
              div.ae4:has(span.qh[title="Starred"]) .F.cf.zt,
              div.ae4:has(span.qh:contains("Starred")) .F.cf.zt {
                 border-radius: 8px;
              }
            `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            },
        }, {
            id: 'squarifyTheme',
            name: 'Squarify UI Elements',
            description: 'Removes rounded corners from all elements for a sharp, squared-off look.',
            group: 'UI & Visuals',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-squarify-theme';
                this._styleElement.textContent = `
                    *, *::before, *::after {
                        border-radius: 0 !important;
                    }
                `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'animatedCompose',
            name: 'Animated Compose Button',
            description: 'Applies a lively, breathing animation to the Compose button.',
            group: 'UI & Visuals',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-animated-compose';
                this._styleElement.textContent = `
                .aic > .z0 > .T-I.T-I-KE {
                    background: linear-gradient(135deg, #a8e063, #56ab2f) !important;
                    color: white !important;
                    font-weight: bold !important;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.25);
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    border-radius: 0 !important;
                    width: 220px !important;
                    position: relative;
                    overflow: hidden;
                    animation: gm-breathing-pulse 4s ease-in-out infinite !important;
                    transition: all 0.3s ease !important;
                }
                .aic > .z0 > .T-I.T-I-KE::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -85%;
                    width: 60%;
                    height: 100%;
                    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%);
                    transform: skewX(-25deg);
                }
                .aic > .z0 > .T-I.T-I-KE:hover::before {
                    animation: gm-sheen 1s ease-out 1;
                }
                @keyframes gm-breathing-pulse {
                    0% { transform: scale(1); opacity: 0.95; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                    50% { transform: scale(1.02); opacity: 1; box-shadow: 0 4px 15px rgba(86, 171, 47, 0.4); }
                    100% { transform: scale(1); opacity: 0.95; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                }
                @keyframes gm-sheen {
                    from { left: -85%; } to { left: 125%; }
                }
                 .Cr.ada {
                    padding-left: 16px !important;
                 }
                .aic .T-I-KE .T-I-J3 {
                    justify-content: center !important;
                }
            `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'animatedStars',
            name: 'Animated Star Icons',
            description: 'Replaces the static star icons with a glowing, animated version.',
            group: 'UI & Visuals',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-animated-stars';
                this._styleElement.textContent = `
                .T-KT-Jp, .zd[aria-checked="true"] .T-KT {
                    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFC107"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>') !important;
                    background-position: center !important;
                    background-repeat: no-repeat !important;
                    animation: gm-star-glow 1.5s infinite alternate !important;
                }
                .T-KT-Jp img, .zd[aria-checked="true"] .T-KT img {
                    opacity: 0 !important;
                }
                @keyframes gm-star-glow {
                    from { filter: drop-shadow(0 0 2px #ffc107); }
                    to { filter: drop-shadow(0 0 6px #ffeb3b); }
                }
            `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },
        {
            id: 'styleDateTime',
            name: 'Style Email Date/Time',
            description: 'Applies custom colors and background to the date/time stamp in emails.',
            group: 'UI & Visuals',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-style-datetime';
                this._styleElement.textContent = `
                span.g3 {
                  color: #999999 !important;
                  background-color: #d0e0e3 !important;
                  font-weight: 700 !important;
                  font-style: normal !important;
                  padding: 2px 4px;
                  border-radius: 3px;
                }
            `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            },
        },

        // Group: Themes
        {
            id: 'gmailDarkMode',
            name: 'Enable Gmail Dark Mode',
            description: "Toggles Gmail's native dark theme and applies a dark loading screen to prevent white flash.",
            group: 'Themes',
            _styleElement: null,
            _loadingStyleElement: null,
            preInit() {
                // This part runs immediately at document-start to prevent the white flash
                this._loadingStyleElement = document.createElement('style');
                this._loadingStyleElement.id = 'gm-dark-loading-screen';
                this._loadingStyleElement.textContent = `
                  /* full-page dark underlay to prevent white flash */
                  html, body {
                    background-color: #121212 !important;
                  }

                  /* kill every CSS animation/transition */
                  *, *::before, *::after {
                    animation: none !important;
                    transition: none !important;
                  }

                  /* override Gmail’s loader */
                  #loading, #stb,
                  .la-i > div,
                  .la-k .la-m, .la-i > .la-m,
                  .la-k .la-l, .la-k .la-r {
                    background-color: #121212 !important;
                    border: none !important;
                  }

                  /* loader text/links */
                  .msg, .msgb,
                  .submit_as_link, #loading a {
                    color: #e0e0e0 !important;
                  }
                `;
                (document.head || document.documentElement).appendChild(this._loadingStyleElement);
            },
            init() {
                // This part runs after the main Gmail UI is stable
                if (this._styleElement) return;
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-native-dark-theme';

                // Fetch and apply Gmail's native dark theme
                const CSS_URL = 'https://mail.google.com/_/scs/mail-static/_/ss/k=gmail.main.C6cicS7fXaU.L.W.O/am=qAEDHAAA-MDlf76A_0qMPQAADPjX-f7VB_7Mb3huMgSy4CECRgQSBegDIhMFfyLy4XWs2-Ay7OMPCQAIQLsjm_04SIQtNH7UOoROacJlGAEAAAAAAAAAAAAAAAAAAAAeHgIC/d=1/excm=at/rs=AHGWq9DdJea2KTVAzJaogOueR9p3iW7rWQ';

                GM_xmlhttpRequest({
                    method: 'GET',
                    url: CSS_URL,
                    onload: (response) => {
                        if (response.status === 200 && this._styleElement) {
                            this._styleElement.textContent = response.responseText;
                        } else {
                            console.error('[Gmail Premium] Failed to load dark mode CSS.');
                            showToast('Failed to load dark mode CSS.', true);
                        }
                    },
                    onerror: () => {
                        console.error('[Gmail Premium] Error fetching dark mode CSS.');
                        showToast('Error fetching dark mode CSS.', true);
                    }
                });

                // Add dark chat roster styles
                this._styleElement.textContent += `
                    /* parent Gmail frame: roster + container */
                    #talk_roster, .VK.s.ik, .aay {
                        background-color: #121212 !important;
                        color: #e0e0e0 !important;
                    }
                    /* borders */
                    #talk_roster, .VK.s.ik {
                        border-color: #333 !important;
                    }
                    /* iframe container */
                    #gtn-roster-iframe-id {
                        background-color: #121212 !important;
                        border: none !important;
                    }
                `;

                 document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
                this._styleElement = null;
                this._loadingStyleElement?.remove();
                this._loadingStyleElement = null;
            },
        },

        // Group: Layout
        {
            id: 'customCSS',
            name: 'Core Layout Fixes',
            description: 'Applies essential CSS tweaks for a cleaner, full-width layout.',
            group: 'Layout',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-custom-css';
                this._styleElement.textContent = `
                div[role="main"] { padding-top: 10px; }
            `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            },
        },
        {
            id: 'styleReplyButton',
            name: 'Style Reply Button',
            description: 'Applies custom borders and padding to the main reply button.',
            group: 'Layout',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-style-reply-button';
                this._styleElement.textContent = `
                div.T-I.J-J5-Ji.T-I-Js-IF.bsQ.T-I-ax7.L3 {
                  border-style: solid !important;
                  border-color: #d9d9d9 !important;
                  height: 25px !important;
                  padding: 0 !important;
                }
            `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            },
        },
        {
            id: 'composeRecipientBorder',
            name: 'Compose Recipient Border',
            description: 'Adds a border below the To/Cc/Subject fields in the compose window.',
            group: 'Layout',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-compose-recipient-border';
                this._styleElement.textContent = `
                div.et {
                  border-color: #efefef !important;
                  border-style: solid !important;
                  border-width: 0 0 1px 0 !important;
                }
            `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            },
        },
        {
            id: 'collapseChatSidebar',
            name: 'Collapse Chat Sidebar',
            description: 'Shrinks the chat/navigation sidebar to a minimal icon-only bar.',
            group: 'Layout',
            _observer: null,
            init() {
                const COLLAPSED_WIDTH = 56; // px

                function updateCollapse() {
                    const mailLink = document.querySelector('div[role="link"][aria-label^="Mail"]');
                    const mainPanel = document.querySelector('div[role="main"]');
                    if (!mailLink || !mainPanel) return;

                    const navPanel = mailLink.closest('div[role="navigation"], aside');
                    if (navPanel) {
                        navPanel.style.width = `${COLLAPSED_WIDTH}px`;
                        navPanel.style.minWidth = `${COLLAPSED_WIDTH}px`;
                    }
                }
                updateCollapse();
                this._observer = new MutationObserver(updateCollapse);
                this._observer.observe(document.body, { childList: true, subtree: true });
            },
            destroy() {
                this._observer?.disconnect();
                this._observer = null;
                 const mailLink = document.querySelector('div[role="link"][aria-label^="Mail"]');
                 if(!mailLink) return;
                 const navPanel = mailLink.closest('div[role="navigation"], aside');
                 if (navPanel) {
                     navPanel.style.width = '';
                     navPanel.style.minWidth = '';
                 }
            }
        },
        {
            id: 'hideChatWithHoverLip',
            name: 'Hover to Reveal Chat',
            description: 'Hides the chat/nav panel completely, revealing it on hover over a left-side "lip".',
            group: 'Layout',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-chat-hover';
                this._styleElement.textContent = `
                    .aeN.WR.a6o {
                        position: fixed !important;
                        left: 0;
                        top: 64px; /* Adjust based on header height */
                        height: calc(100vh - 64px) !important;
                        z-index: 1001;
                        transform: translateX(calc(-100% + 5px));
                        transition: transform 0.25s ease-in-out;
                        border-right: 1px solid #d3d3d3;
                    }
                    .aeN.WR.a6o::after {
                        content: '';
                        position: absolute;
                        right: 0;
                        top: 0;
                        width: 5px;
                        height: 100%;
                        background: #5e97f6;
                        cursor: pointer;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                    }
                    .aeN.WR.a6o:hover {
                        transform: translateX(0);
                        box-shadow: 2px 0 10px rgba(0,0,0,0.2);
                    }
                     .aeN.WR.a6o:hover::after {
                        opacity: 1;
                    }
                    /* Adjust main content padding to account for hidden bar */
                    .bkK>.nH.oy8Mbf, .brC-aT5-aOt-I.brC-aT5-aOt-I {
                        padding-left: 15px !important;
                    }
                `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },

        // Group: Productivity
        {
            id: 'showEmail',
            name: 'Show Raw Emails',
            description: 'Displays the full email address instead of just the sender\'s name.',
            group: 'Productivity',
            _observer: null,
            init() {
                const showRawAddress = () => {
                    document.querySelectorAll('span[email]').forEach(el => {
                        const email = el.getAttribute('email');
                        if (email && el.textContent !== email) {
                            el.textContent = email;
                        }
                    });
                };
                this._observer = new MutationObserver(showRawAddress);
                this._observer.observe(document.body, { childList: true, subtree: true });
                showRawAddress();
            },
            destroy() {
                this._observer?.disconnect();
            },
        }, {
            id: 'fmtToolbar',
            name: 'Toggleable Formatting Bar',
            description: 'Adds a "Formatting" button to hide/show the compose toolbar.',
            group: 'Productivity',
            _observer: null,
            init() {
                const enhanceComposeWindow = (root) => {
                    if (root.dataset.gmFmt) return;
                    const toolbar = root.querySelector('.aX');
                    if (!toolbar) return;

                    root.dataset.gmFmt = '1';
                    const btn = document.createElement('button');
                    btn.textContent = 'Formatting';
                    btn.className = 'gm-btn-secondary';
                    toolbar.style.visibility = 'hidden';
                    btn.onclick = () => {
                        const isHidden = toolbar.style.visibility === 'hidden';
                        toolbar.style.visibility = isHidden ? 'visible' : 'hidden';
                        btn.classList.toggle('active', isHidden);
                    };
                    toolbar.parentNode.insertBefore(btn, toolbar);
                };

                this._observer = new MutationObserver(muts => {
                    muts.forEach(m => m.addedNodes.forEach(n => {
                        if (n.nodeType === 1 && n.matches('.AD')) enhanceComposeWindow(n);
                    }));
                });
                this._observer.observe(document.body, { childList: true });
                document.querySelectorAll('.AD').forEach(enhanceComposeWindow);
            },
            destroy() {
                this._observer?.disconnect();
                document.querySelectorAll('.gm-btn-secondary').forEach(btn => btn.remove());
                document.querySelectorAll('.AD[data-gm-fmt]').forEach(el => {
                    const toolbar = el.querySelector('.aX');
                    if (toolbar) toolbar.style.visibility = 'visible';
                    delete el.dataset.gmFmt;
                });
            },
        }, {
            id: 'uiTweaks',
            name: 'Disable Compose Hover-Cards',
            description: 'Disables the distracting hover-card on email addresses in compose fields.',
            group: 'Productivity',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-uiTweaks';
                this._styleElement.textContent = `
                .agh .afV > .afW { pointer-events: none !important; }
                .agh .af6 { pointer-events: auto !important; }
            `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            },
        }, {
            id: 'contactChipDoubleClick',
            name: 'Double-Click to Copy Email',
            description: 'Double-click a contact in To/Cc/Bcc to copy their email address.',
            group: 'Productivity',
            _clickHandler: null,
            init() {
                this._clickHandler = (e) => {
                    const chip = e.target.closest('.afV[data-hovercard-id]');
                    if (!chip) return;
                    const email = chip.getAttribute('data-hovercard-id');
                    if (!email) return;
                    navigator.clipboard.writeText(email).then(() => {
                        showToast('Email copied to clipboard!');
                    }).catch(err => {
                        console.error('Failed to copy email: ', err);
                        showToast('Failed to copy email.', true);
                    });
                };
                document.body.addEventListener('dblclick', this._clickHandler);
            },
            destroy() {
                if (this._clickHandler) {
                    document.body.removeEventListener('dblclick', this._clickHandler);
                }
            }
        },

        // Group: Header Elements
        {
            id: 'hideAppsGrid',
            name: 'Hide Google Apps Grid',
            description: 'Hides the 9-dot Google Apps grid menu in the main header.',
            group: 'Header Elements',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-apps-grid';
                this._styleElement.textContent = `div.gb_Vc[aria-label="Google apps"] { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },
        {
            id: 'hideProfileBox',
            name: 'Hide Account Profile Box',
            description: 'Hides your Google Account profile picture/avatar in the main header.',
            group: 'Header Elements',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-profile-box';
                this._styleElement.textContent = `div.gb_Wa { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },
        {
            id: 'hideTopBarSupport',
            name: 'Hide Top Bar Support Icon',
            description: 'Hides the question mark "Support" icon in the main header.',
            group: 'Header Elements',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-top-support';
                this._styleElement.textContent = `.zo[data-tooltip="Support"] { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideTopBarSettings',
            name: 'Hide Top Bar Settings Icon',
            description: 'Hides the main Gmail "Settings" gear icon in the header.',
            group: 'Header Elements',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-top-settings';
                this._styleElement.textContent = `.FI[data-tooltip="Settings"] { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },

        // Group: Hubspot
        {
            id: 'hubspotActivityIndicator',
            name: 'Hubspot Activity Indicator',
            description: 'Shows a colored bar at the top of the page indicating Hubspot status (Green/Red).',
            group: 'Hubspot',
            _elements: [],
            _observers: [],
            init() {
                const lip = document.createElement('div');
                lip.id = 'gm-header-lip';
                Object.assign(lip.style, {
                    position: 'fixed', top: '0', left: '0', right: '0', height: '6px',
                    zIndex: '10000', transition: 'background .3s ease',
                });
                document.body.appendChild(lip);
                this._elements.push(lip);
                const colorLip = () => {
                    const img = document.querySelector('img.kratos__button_img');
                    lip.style.background = img?.src.includes('sprocket-ok') ? '#2ecc71' : img?.src.includes('sprocket-off') ? '#e74c3c' : '#95a5a6';
                };
                const hubspotObserver = new MutationObserver(colorLip);
                hubspotObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['src'] });
                this._observers.push(hubspotObserver);
                colorLip();
            },
            destroy() {
                this._elements.forEach(el => el.remove());
                this._observers.forEach(obs => obs.disconnect());
            },
        }, {
            id: 'hideHubspotControls',
            name: 'Hide Hubspot Compose Toolbar',
            description: 'Hides the Hubspot toolbar (Templates, Meetings, etc.) in the compose window.',
            group: 'Hubspot',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-hubspot-controls';
                this._styleElement.textContent = `div#tool-row { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideHubspotLogTracker',
            name: 'Hide Log Tracker Indicator',
            description: 'Hides the Hubspot log/track status indicator that appears above the compose window.',
            group: 'Hubspot',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-hubspot-log-tracker';
                this._styleElement.textContent = `.hubspot-logtrack-indicator { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideHubspotProfileButton',
            name: 'Hide Sender Profile Button',
            description: 'Hides the "View [Sender]\'s Profile" button from the Hubspot sidebar.',
            group: 'Hubspot',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-hubspot-profile-btn';
                this._styleElement.textContent = `span.hubspot[data-add-or-view-contact-button-container] { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideHubspotContactIcon',
            name: 'Hide Hubspot Icon on Contact Chips',
            description: 'Hides the Hubspot sprocket icon on contact chips in the To/Cc/Bcc fields.',
            group: 'Hubspot',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-hubspot-contact-icon';
                this._styleElement.textContent = `.agh .hubspot.indicator-container { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },

        // Group: AI & Tools
        {
            id: 'hideGeminiHelpMeWrite',
            name: 'Hide Gemini "Help me write"',
            description: 'Hides the "Help me write" AI prompt in the compose window.',
            group: 'AI & Tools',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-gemini-help-me-write';
                this._styleElement.textContent = `
                 div.QT9oZc, div[data-promo-id="promo-mako-c2c"] { display: none !important; }
                 span:has(i18n-string[data-key="compose.ComposeActionBar.generateTemplate.button"]) { display: none !important; }
            `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideAskGemini',
            name: 'Hide "Ask Gemini" Button',
            description: 'Hides the "Ask Gemini" button in the main top header.',
            group: 'AI & Tools',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-ask-gemini';
                this._styleElement.textContent = `.e5IPTd.Zmxtcf { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },
        {
            id: 'hideSummarizeEmail',
            name: 'Hide "Summarize Email" Button',
            description: 'Hides the Gemini "Summarize this email" button that appears at the top of an email thread.',
            group: 'AI & Tools',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-summarize-email';
                this._styleElement.textContent = ` .einvLd { display: none !important; } `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },
        {
            id: 'hideSmartFeaturesBanner',
            name: 'Hide "Smart Features" Banner',
            description: 'Hides the top banner prompting to "Turn on smart features".',
            group: 'AI & Tools',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-smart-features-banner';
                // The class .ahS seems to be the primary container for this banner.
                this._styleElement.textContent = `.ahS { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },
        {
            id: 'hideLoomButton',
            name: 'Hide Loom Button',
            description: 'Hides the Loom recording button in the compose window toolbar.',
            group: 'AI & Tools',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-loom-button';
                this._styleElement.textContent = `.loom-button-td { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        },

        // Group: Declutter
        {
            id: 'hideOrgWarnings',
            name: 'Hide "Outside Org" Warning',
            description: 'Hides the yellow banner warning about external recipients.',
            group: 'Declutter',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-org-warnings';
                this._styleElement.textContent = `.ac4:has(.aeM) { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideEmailLabels',
            name: 'Hide Labels in Emails',
            description: 'Hides the label tags (e.g., "Inbox") shown at the top of an email.',
            group: 'Declutter',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-email-labels';
                this._styleElement.textContent = `span[jsname="SjW3R"] { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideProfilePicture',
            name: 'Hide Profile Picture in Emails',
            description: 'Hides the sender\'s profile picture in the email view to save space.',
            group: 'Declutter',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-profile-picture';
                this._styleElement.textContent = `td.aoY { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideEverythingElseHeader',
            name: 'Hide "Everything else" Header',
            description: 'Hides the header bar for the "Everything else" email group.',
            group: 'Declutter',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-everything-else-header';
                this._styleElement.textContent = `div.ae4:has(div.aDa:not([title])) .aAr.Wg { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideLabelsSection',
            name: 'Hide "Labels" Section',
            description: 'Hides the entire "Labels" section in the left sidebar.',
            group: 'Declutter',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-labels-section';
                this._styleElement.textContent = `div.ajl:has(h2.aWk:contains("Labels")), .aAw.FgKVne { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideStarredHeader',
            name: 'Hide "Starred" Section Header',
            description: 'Hides the header for the "Starred" email group.',
            group: 'Declutter',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-starred-header';
                this._styleElement.textContent = `div.ae4:has(span.qh:contains("Starred")) > .Wg.aAD.aAr { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideSubjectToolbar',
            name: 'Hide Empty Subject Toolbar',
            description: 'Hides the empty space where the Hubspot toolbar was.',
            group: 'Declutter',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-subject-toolbar';
                this._styleElement.textContent = `.SubjectToolbar.az6.aoD { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideDiscoverMore',
            name: 'Hide "Discover More" Button',
            description: 'Hides the "Discover more" button that can appear in the sidebar.',
            group: 'Declutter',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-discover-more';
                this._styleElement.textContent = `.E0E5jb { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            }
        }, {
            id: 'hideMiscClutter',
            name: 'Hide Misc. Clutter',
            description: 'Hides various other elements like meeting ads and bottom banners.',
            group: 'Declutter',
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-misc-clutter';
                const selectors = ['.aT', '.aV2', '.bq9', '.Bs.nH.iY', '.aLO', '.apO', '.G-atb'];
                this._styleElement.textContent = `${selectors.join(',\n')} { display: none !important; }`;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            },
        },

        // GROUP: Email Thread Declutter
        {
            id: 'nukeReplyMetadata',
            name: 'Nuke Reply Metadata',
            group: 'Email Thread Declutter',
            description: 'Aggressively finds and replaces all reply/forward headers with a divider.',
            init() {
                const featId = this.id;
                const gmailDividerSelector = 'hr[style*="display:inline-block"][style*="width:98%"]';

                const processMetadataBlock = div => {
                    if (div.dataset.gmProcessed) return;
                    div.dataset.gmProcessed = 'true';

                    const text = div.textContent
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line)
                        .join(' ');

                    // Parse From
                    const fromMatch = text.match(/From:\s*(.*?)\s*<([^>]+)>/i);
                    let name = '', email = '';
                    if (fromMatch) {
                        name = fromMatch[1].trim();
                        email = fromMatch[2].trim();
                    }

                    // Parse Cc
                    const ccMatch = text.match(/Cc:\s*(.*?)\s*<([^>]+)>/i);
                    let ccName = '', ccEmail = '';
                    if (ccMatch) {
                        ccName = ccMatch[1].trim();
                        ccEmail = ccMatch[2].trim();
                    }

                    // Parse Bcc
                    const bccMatch = text.match(/Bcc:\s*(.*?)\s*<([^>]+)>/i);
                    let bccName = '', bccEmail = '';
                    if (bccMatch) {
                        bccName = bccMatch[1].trim();
                        bccEmail = bccMatch[2].trim();
                    }

                    // Hide full metadata
                    div.style.display = 'none';
                    div.dataset.gmHiddenBy = featId;

                    // Insert custom dashed divider
                    const hr = document.createElement('hr');
                    hr.style.cssText = 'border:none; border-top:2px dashed #5e97f6; margin:12px 0';
                    hr.dataset.gmHiddenBy = `${featId}_hr`;
                    div.parentNode.insertBefore(hr, div);

                    // Inject simple lines in order: From, Cc, Bcc
                    let last = hr;
                    if (appState.settings.nukeReplyMetadataSimple && email) {
                        const simpleFrom = document.createElement('div');
                        simpleFrom.dataset.gmHiddenBy = `${featId}_simple`;
                        simpleFrom.style.cssText = 'margin:4px 0 12px; font-size:12px; color:#999';
                        simpleFrom.innerHTML = `<strong>From:</strong> <a href="mailto:${email}" style="color:#8ab4f8; text-decoration:none;">${name || email}</a>`;
                        last.insertAdjacentElement('afterend', simpleFrom);
                        last = simpleFrom;
                    }
                    if (appState.settings.nukeReplyMetadataShowCc && ccEmail) {
                        const simpleCc = document.createElement('div');
                        simpleCc.dataset.gmHiddenBy = `${featId}_cc`;
                        simpleCc.style.cssText = 'margin:4px 0 12px; font-size:12px; color:#999';
                        simpleCc.innerHTML = `<strong>Cc:</strong> <a href="mailto:${ccEmail}" style="color:#8ab4f8; text-decoration:none;">${ccName || ccEmail}</a>`;
                        last.insertAdjacentElement('afterend', simpleCc);
                        last = simpleCc;
                    }
                    if (appState.settings.nukeReplyMetadataShowBcc && bccEmail) {
                        const simpleBcc = document.createElement('div');
                        simpleBcc.dataset.gmHiddenBy = `${featId}_bcc`;
                        simpleBcc.style.cssText = 'margin:4px 0 12px; font-size:12px; color:#999';
                        simpleBcc.innerHTML = `<strong>Bcc:</strong> <a href="mailto:${bccEmail}" style="color:#8ab4f8; text-decoration:none;">${bccName || bccEmail}</a>`;
                        last.insertAdjacentElement('afterend', simpleBcc);
                    }
                };

                const findAndProcessMetadata = rootNode => {
                    if (!rootNode.querySelectorAll) return;

                    // RULE 0: Remove Gmail’s default divider
                    rootNode.querySelectorAll(gmailDividerSelector).forEach(el => el.remove());

                    // Find and process all other metadata blocks
                    const selectors = [
                        'blockquote div[id*="divRplyFwdMsg"]',
                        'div.gmail_quote',
                        'div[style*="1pt solid"]',
                        'p',
                        'blockquote *'
                    ];
                    rootNode.querySelectorAll(selectors.join(',')).forEach(el => {
                        const txt = el.textContent.trim();
                        if (
                            el.matches('blockquote div[id*="divRplyFwdMsg"], div.gmail_quote') ||
                            /^-+ Forwarded message -+$/i.test(txt) ||
                            /^On\s.+\swrote:$/i.test(txt) ||
                            (el.tagName === 'P' &&
                                txt.includes('From:') && txt.includes('Sent:') &&
                                txt.includes('To:') && txt.includes('Subject:')) ||
                            (el.matches('div[style*="1pt solid"]') && txt.includes('From:'))
                        ) {
                            processMetadataBlock(el);
                        }
                    });
                };

                addHidingRule(featId, findAndProcessMetadata);
            },
            destroy() {
                document.querySelectorAll(`[data-gm-hidden-by="${this.id}_simple"]`).forEach(el => el.remove());
                document.querySelectorAll(`[data-gm-hidden-by="${this.id}_cc"]`).forEach(el => el.remove());
                document.querySelectorAll(`[data-gm-hidden-by="${this.id}_bcc"]`).forEach(el => el.remove());
                document.querySelectorAll(`[data-gm-hidden-by="${this.id}_hr"]`).forEach(el => el.remove());
                removeHidingRule(this.id);
                document.querySelectorAll('[data-gm-processed]').forEach(el => el.removeAttribute('data-gm-processed'));
            },
        },
        {
            id: 'hideReactionButton',
            name: 'Hide "Add reaction" button',
            group: 'Email Thread Declutter',
            description: "Hides the emoji reaction button that appears on individual emails.",
            _styleElement: null,
            init() {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'gm-hide-reactions';
                this._styleElement.textContent = `
                    button[aria-label="Add reaction"], 
                    div.wrsVRe { 
                        display: none !important; 
                    }
                `;
                document.head.appendChild(this._styleElement);
            },
            destroy() {
                this._styleElement?.remove();
            },
        },
        {
            id: 'hideAllSignaturesInChain',
            name: 'Hide All Signatures in Reply Chain',
            description: 'Removes all standard, legacy, and device signatures from the entire reply chain.',
            init() {
                const hideSignatures = (rootNode) => {
                    if (!rootNode.querySelectorAll) return;
                    rootNode.querySelectorAll('blockquote td[style*="border-top"]').forEach(td => {
                        const tbl = td.closest('table');
                        if (tbl && tbl.style.display !== 'none') {
                            tbl.style.display = 'none';
                            tbl.dataset.gmHiddenBy = this.id;
                        }
                    });
                    rootNode.querySelectorAll('blockquote .gmail_signature_prefix, blockquote .gmail_signature').forEach(el => {
                        if (el.style.display !== 'none') {
                            el.style.display = 'none';
                            el.dataset.gmHiddenBy = this.id;
                        }
                    });
                    function hideNodeAndPrevBr(node) {
                        if (node.style.display !== 'none') {
                            node.style.display = 'none';
                            node.dataset.gmHiddenBy = 'hideAllSignaturesInChain';
                        }
                        const prev = node.previousElementSibling;
                        if (prev && prev.tagName === 'BR' && prev.style.display !== 'none') {
                            prev.style.display = 'none';
                            prev.dataset.gmHiddenBy = 'hideAllSignaturesInChain';
                        }
                    }
                    rootNode.querySelectorAll('div[dir="ltr"]').forEach(div => {
                        if (div.textContent.trim() === 'Sent from my iPhone') {
                            hideNodeAndPrevBr(div);
                        }
                    });
                    rootNode.querySelectorAll('blockquote a').forEach(a => {
                        if (/^Sent from .*Mail for iPhone$/i.test(a.textContent.trim())) {
                            const container = a.closest('div') || a;
                            hideNodeAndPrevBr(container);
                        }
                    });
                    rootNode.querySelectorAll('blockquote div[id*="ms-outlook-mobile-signature"], blockquote div:has(> a[href*="aka.ms/"])').forEach(el => {
                        if (el.style.display !== 'none') {
                            el.style.display = 'none';
                            el.dataset.gmHiddenBy = this.id;
                        }
                    });
                };
                addHidingRule(this.id, hideSignatures);
            },
            destroy() {
                removeHidingRule(this.id);
            },
        }
    ];


    // —————————————————————
    // 3. DOM HELPERS & TOAST NOTIFICATIONS
    // —————————————————————
    let appState = {};

    function createCogSvg() {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "currentColor");
        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");
        const path1 = document.createElementNS(svgNS, "path");
        path1.setAttribute("d", "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69-.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z");
        svg.appendChild(path1);
        return svg;
    }

    function showToast(message, isError = false) {
        let toast = document.getElementById('gm-toast-notification');
        if (toast) toast.remove();
        toast = document.createElement('div');
        toast.id = 'gm-toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background-color: ${isError ? '#d9534f' : '#5cb85c'};
            color: white; padding: 10px 20px; border-radius: 5px; z-index: 10002;
            opacity: 0; transition: opacity 0.3s, bottom 0.3s;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.bottom = '30px';
        }, 10);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.bottom = '20px';
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }


    // —————————————————————
    // 4. UI & SETTINGS PANEL
    // —————————————————————
    function buildPanel(appState) {
        const groups = features.reduce((acc, f) => {
            acc[f.group] = acc[f.group] || [];
            acc[f.group].push(f);
            return acc;
        }, {});

        const panelContainer = document.createElement('div');
        panelContainer.id = 'gm-panel-container';
        const overlay = document.createElement('div');
        overlay.className = 'gm-panel-overlay';
        overlay.onclick = () => document.body.classList.remove('gm-panel-open');
        const panel = document.createElement('div');
        panel.className = 'gm-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-labelledby', 'gm-panel-title');
        const header = document.createElement('header');
        const title = document.createElement('h2');
        title.id = 'gm-panel-title';
        title.textContent = 'Gmail Premium Suite';
        const version = document.createElement('span');
        version.className = 'version';
        version.textContent = 'v6.3';
        header.append(title, version);

        const main = document.createElement('main');
        const groupOrder = ['UI & Visuals', 'Themes', 'Layout', 'Header Elements', 'Email Thread Declutter', 'Productivity', 'Hubspot', 'AI & Tools', 'Declutter'];

        const createSubSetting = (id, name, description, parentInput) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'gm-switch-wrapper gm-sub-setting-wrapper';
            wrapper.dataset.tooltip = description;
            const label = document.createElement('label');
            label.className = 'gm-switch';
            label.htmlFor = `switch-${id}`;
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = `switch-${id}`;
            input.checked = appState.settings[id];
            input.onchange = async (e) => {
                appState.settings[id] = e.target.checked;
                const parentFeat = features.find(x => x.id === 'nukeReplyMetadata');
                parentFeat.destroy();
                if (appState.settings.nukeReplyMetadata) {
                    parentFeat.init();
                }
                await settingsManager.save(appState.settings);
            };
            const slider = document.createElement('span');
            slider.className = 'slider';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'label';
            nameSpan.textContent = name;
            label.append(input, slider);
            wrapper.append(label, nameSpan);
            wrapper.style.display = parentInput.checked ? 'flex' : 'none';
            parentInput.addEventListener('change', (e) => {
                wrapper.style.display = e.target.checked ? 'flex' : 'none';
            });
            return wrapper;
        };

        groupOrder.forEach(groupName => {
            if (!groups[groupName] || groups[groupName].length === 0) return;

            const fieldset = document.createElement('fieldset');
            fieldset.className = 'gm-feature-group';
            const legend = document.createElement('legend');
            legend.textContent = groupName;
            fieldset.appendChild(legend);

            groups[groupName].forEach(f => {
                const wrapper = document.createElement('div');
                wrapper.className = 'gm-switch-wrapper';
                wrapper.dataset.tooltip = f.description;
                const label = document.createElement('label');
                label.className = 'gm-switch';
                label.htmlFor = `switch-${f.id}`;
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = `switch-${f.id}`;
                input.dataset.featureId = f.id;
                input.checked = appState.settings[f.id];
                input.onchange = async (e) => {
                    const id = e.target.dataset.featureId;
                    appState.settings[id] = e.target.checked;
                    const feat = features.find(x => x.id === id);
                    if (feat.destroy) {
                        feat.destroy();
                    }
                    if (appState.settings[id]) {
                        // For dark mode, preInit is handled separately on page load,
                        // so here we only need to call init.
                        if (feat.init) {
                            feat.init();
                        }
                    }
                    await settingsManager.save(appState.settings);
                };
                const slider = document.createElement('span');
                slider.className = 'slider';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'label';
                nameSpan.textContent = f.name;

                label.append(input, slider);
                wrapper.append(label, nameSpan);
                fieldset.appendChild(wrapper);

                if (f.id === 'nukeReplyMetadata') {
                    const fromSub = createSubSetting('nukeReplyMetadataSimple', "Show simple 'From:' header", "Replaces the divider with a simple 'From: Name <email>' line.", input);
                    const ccSub = createSubSetting('nukeReplyMetadataShowCc', "Show Cc:", "Also show the Cc: line if available.", input);
                    const bccSub = createSubSetting('nukeReplyMetadataShowBcc', "Show Bcc:", "Also show the Bcc: line if available.", input);
                    fieldset.append(fromSub, ccSub, bccSub);
                }
            });
            main.appendChild(fieldset);
        });

        const footer = document.createElement('footer');
        const footerControls = document.createElement('div');
        footerControls.className = 'gm-footer-controls';

        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Settings';
        exportBtn.className = 'gm-btn-secondary';
        exportBtn.onclick = () => {
            const settingsJson = JSON.stringify(appState.settings, null, 2);
            const blob = new Blob([settingsJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gmail-premium-settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Settings exported!');
        };

        const importBtn = document.createElement('button');
        importBtn.textContent = 'Import Settings';
        importBtn.className = 'gm-btn-secondary';
        importBtn.onclick = () => {
            document.getElementById('gm-import-input').click();
        };

        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.id = 'gm-import-input';
        importInput.accept = '.json';
        importInput.style.display = 'none';
        importInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedSettings = JSON.parse(event.target.result);
                    if (typeof importedSettings.settingsButton !== 'boolean') {
                       throw new Error("Invalid settings file.");
                    }
                    await settingsManager.save(importedSettings);
                    showToast('Settings imported. Page will now reload.');
                    setTimeout(() => window.location.reload(), 1500);
                } catch (err) {
                    console.error("Failed to import settings:", err);
                    showToast('Error: Invalid or corrupt settings file.', true);
                }
            };
            reader.readAsText(file);
        };

        footerControls.append(importInput, importBtn, exportBtn);

        const closeBtn = document.createElement('button');
        closeBtn.id = 'gm-close-btn';
        closeBtn.className = 'gm-btn-primary';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => document.body.classList.remove('gm-panel-open');
        footer.append(footerControls, closeBtn);

        panel.append(header, main, footer);
        panelContainer.append(overlay, panel);
        document.body.appendChild(panelContainer);
    }


    // —————————————————————
    // 5. STYLES
    // —————————————————————
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
            :root { --panel-font: 'Inter', sans-serif; --panel-radius: 12px; --panel-shadow: 0 10px 30px -5px rgba(0,0,0,0.3); --gm-panel-bg: #2c2c2c; --gm-panel-fg: #f0f0f0; --gm-border-color: #444; --gm-accent-color: #5e97f6; }
            body.gm-panel-open #gm-panel-container .gm-panel-overlay { opacity: 1; pointer-events: auto; }
            .gm-panel-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 10000; opacity: 0; pointer-events: none; transition: opacity .3s ease; }
            .gm-panel { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95); width: 90%; max-width: 520px; background: var(--gm-panel-bg, #2c2c2c); color: var(--gm-panel-fg, #f0f0f0); border-radius: var(--panel-radius); box-shadow: var(--panel-shadow); font-family: var(--panel-font); opacity: 0; pointer-events: none; transition: opacity .3s ease, transform .3s ease; z-index: 10001; display: flex; flex-direction: column; }
            body.gm-panel-open .gm-panel { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%) scale(1); }
            .gm-panel header { padding: 20px 24px; border-bottom: 1px solid var(--gm-border-color, #444); display: flex; justify-content: space-between; align-items: center; }
            .gm-panel h2 { margin: 0; font-size: 18px; font-weight: 700; }
            .gm-panel .version { font-size: 12px; opacity: 0.6; }
            .gm-panel main { padding: 16px 24px; flex-grow: 1; max-height: 70vh; overflow-y: auto; }
            .gm-panel footer { padding: 16px 24px; border-top: 1px solid var(--gm-border-color, #444); display: flex; justify-content: space-between; align-items: center; }
            .gm-feature-group { border: 1px solid var(--gm-border-color, #444); border-radius: 8px; padding: 16px; margin: 0 0 16px; }
            .gm-feature-group legend { padding: 0 8px; font-size: 14px; font-weight: 500; color: var(--gm-accent-color, #5e97f6); }
            .gm-switch-wrapper { display: flex; align-items: center; margin-bottom: 12px; position: relative; }
            .gm-switch-wrapper:last-child { margin-bottom: 0; }
            .gm-switch { display: flex; align-items: center; cursor: pointer; }
            .gm-switch-wrapper .label { margin-left: 12px; flex: 1; font-size: 15px; }
            .gm-switch input { display: none; }
            .gm-switch .slider { width: 40px; height: 22px; background: #555; border-radius: 11px; position: relative; transition: background .2s ease; }
            .gm-switch .slider:before { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform .2s ease; }
            .gm-switch input:checked + .slider { background: var(--gm-accent-color, #5e97f6); }
            .gm-switch input:checked + .slider:before { transform: translateX(18px); }
            .gm-switch-wrapper::after { content: attr(data-tooltip); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 8px; background: #111; color: #fff; padding: 6px 10px; border-radius: 4px; font-size: 12px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .2s; z-index: 1; }
            .gm-switch-wrapper:hover::after { opacity: 1; }
            .gm-sub-setting-wrapper { margin-left: 20px; }
            .gm-footer-controls { display: flex; gap: 10px; }
            .gm-btn-primary { background-color: var(--gm-accent-color, #5e97f6); color: white; border: none; padding: 10px 20px; border-radius: 6px; font-family: var(--panel-font); font-weight: 500; cursor: pointer; transition: background-color .2s; }
            .gm-btn-primary:hover { background-color: #4a80d3; }
            .gm-btn-secondary { background-color: #444; color: #ddd; border: 1px solid #666; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-family: var(--panel-font); cursor: pointer; transition: background-color .2s, border-color .2s; }
            .gm-btn-secondary:hover { background-color: #555; border-color: #777; }
            .gm-btn-secondary.active { background-color: #5e97f6; border-color: #5e97f6; }
            #gm-floating-settings-btn {
                position: fixed; bottom: 24px; left: 24px; width: 56px; height: 56px;
                background-color: var(--gm-accent-color, #5e97f6); color: white; border: none;
                border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: pointer;
                display: flex; align-items: center; justify-content: center; z-index: 9999;
                transition: transform .2s ease, background-color .2s ease;
            }
            #gm-floating-settings-btn:hover { transform: scale(1.05); background-color: #4a80d3; }
        `;
        document.head.appendChild(style);
    }


    // —————————————————————
    // 6. MAIN BOOTSTRAP
    // —————————————————————
    async function main() {
        appState.settings = await settingsManager.load();

        // Because @run-at is document-start, run the dark mode PRE-INITIALIZER
        // immediately to apply the dark loading screen and prevent flashing.
        if (appState.settings.gmailDarkMode) {
            const darkModeFeat = features.find(f => f.id === 'gmailDarkMode');
            if (darkModeFeat && darkModeFeat.preInit) {
               darkModeFeat.preInit();
            }
        }

        const bootstrapObserver = new MutationObserver((mutations, obs) => {
            if (document.querySelector('.nH.bkK')) {
                obs.disconnect();
                
                // Initialize all features once the main UI is ready
                injectStyles();
                buildPanel(appState);

                features.forEach(f => {
                    // Now, the main init() for all enabled features can run safely
                    if (appState.settings[f.id]) {
                        try {
                            if (f.init) f.init();
                        } catch (error) {
                            console.error(`[Gmail Premium] Error initializing feature "${f.id}":`, error);
                        }
                    }
                });

                // Show the panel on first run
                settingsManager.getFirstRunStatus().then(hasRun => {
                    if (!hasRun) {
                        document.body.classList.add('gm-panel-open');
                        settingsManager.setFirstRunStatus(true);
                    }
                });
            }
        });

        bootstrapObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    main().catch(error => {
        console.error("[Gmail Premium] Failed to initialize:", error);
    });

})();