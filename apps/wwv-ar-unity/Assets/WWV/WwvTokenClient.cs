using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace WWV.AR
{
    [Serializable]
    public class TokenResponse
    {
        public string accessToken;
        public long expiresAt;
    }

    /// <summary>
    /// Obtains a short-lived Niantic JWT from the WWV backend (never embed the service API key in Unity).
    /// </summary>
    public class WwvTokenClient : MonoBehaviour
    {
        public WwvConfig config;

        public IEnumerator FetchToken(Action<string> onToken, Action<string> onError)
        {
            if (config == null)
            {
                onError?.Invoke("WWVConfig is not assigned");
                yield break;
            }

            var url = config.wwvBaseUrl.TrimEnd('/') + "/api/niantic/token";
            using var req = UnityWebRequest.Get(url);
            if (!string.IsNullOrEmpty(config.sessionCookie))
            {
                req.SetRequestHeader("Cookie", config.sessionCookie);
            }

            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                onError?.Invoke(req.error);
                yield break;
            }

            var json = JsonUtility.FromJson<TokenResponse>(req.downloadHandler.text);
            if (string.IsNullOrEmpty(json.accessToken))
            {
                onError?.Invoke("Empty accessToken");
                yield break;
            }

            onToken?.Invoke(json.accessToken);
        }
    }
}
