using UnityEngine;

namespace WWV.AR
{
    /// <summary>
    /// Handles worldwideview://ar?siteId= deep links on device builds.
    /// </summary>
    public class WwvDeepLinkHandler : MonoBehaviour
    {
        public WwvConfig config;
        public string pendingSiteId;

        private void Awake()
        {
            Application.deepLinkActivated += OnDeepLink;
            if (!string.IsNullOrEmpty(Application.absoluteURL))
            {
                OnDeepLink(Application.absoluteURL);
            }
        }

        private void OnDestroy()
        {
            Application.deepLinkActivated -= OnDeepLink;
        }

        private void OnDeepLink(string url)
        {
            if (string.IsNullOrEmpty(url)) return;

            var siteId = ParseSiteId(url);
            if (string.IsNullOrEmpty(siteId)) return;

            pendingSiteId = siteId;
            Debug.Log("[WwvDeepLink] siteId=" + siteId);

            if (config != null)
            {
                var web = config.wwvBaseUrl.TrimEnd('/') + "/?arSite=" + UnityEngine.Networking.UnityWebRequest.EscapeURL(siteId);
                Debug.Log("[WwvDeepLink] Web handoff: " + web);
            }
        }

        private static string ParseSiteId(string url)
        {
            if (url.Contains("arSite="))
            {
                var q = url.Split('?');
                if (q.Length < 2) return null;
                foreach (var part in q[1].Split('&'))
                {
                    if (part.StartsWith("arSite="))
                        return UnityEngine.Networking.UnityWebRequest.UnEscapeURL(part.Substring(7));
                }
            }

            if (url.Contains("siteId="))
            {
                var idx = url.IndexOf("siteId=");
                return UnityEngine.Networking.UnityWebRequest.UnEscapeURL(url.Substring(idx + 7).Split('&')[0]);
            }

            return null;
        }
    }
}
