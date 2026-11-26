(function(){'use strict';
if(!window.NextStepAuth?.configured?.())return;
if(localStorage.getItem('nextstep-profile-activity-consent')!=='yes')return;
// Refresh after a date change or twelve hours of signed-in activity.
// Anonymous/guest traffic is not collected here.
function recordVisit(){
 if(document.visibilityState==='visible')window.NextStepAuth.markActivity().catch(()=>{});
}
recordVisit();
document.addEventListener('visibilitychange',recordVisit);
})();
