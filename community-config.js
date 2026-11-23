/* NextStep Study community connections.
 * Do not publish access tokens, API secrets or private details here.
 * The owner can supply public URLs of the actual Facebook POST and PAGE.
 * Empty means "not connected" — the UI must never pretend feedback was sent.
 */
window.NextStepCommunityConfig=Object.freeze({
 facebookPostUrl:"https://www.facebook.com/share/1HTRs8SwmG/?mibextid=wwXIfr",
 facebookPageUrl:"",
 messengerUrl:"",
 feedbackApiUrl:"", // Set to a deployed Supabase Edge Function URL; public HTTPS only.
 turnstileSiteKey:"", // Public Turnstile site key; the secret belongs only on the server.
 supabaseUrl:"", // Public Supabase project URL for admin authentication.
 supabaseAnonKey:"", // Public publishable/anon key, NEVER the service-role key.
 githubIssuesBase:"https://github.com/dadalupendra/nextstep-study/issues/new"
});
