(function(){'use strict';
if(!window.NextStepAuth?.configured?.())return;
if(localStorage.getItem('nextstep-profile-activity-consent')!=='yes')return;
// One consented activity timestamp per device per 12h, while signed in.
// Anonymous/guest traffic is not collected here.
window.NextStepAuth.markActivity().catch(()=>{});
})();
