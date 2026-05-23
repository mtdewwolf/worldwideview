using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace WWV.AR
{
    /// <summary>
    /// POST GeoJSON FeatureCollection to /api/niantic/coverage/cache (Unity coverage fallback).
    /// </summary>
    public class WwvCoverageExporter : MonoBehaviour
    {
        public WwvConfig config;

        [TextArea(4, 12)]
        public string geoJsonFeatureCollection = "{\"type\":\"FeatureCollection\",\"features\":[]}";

        [ContextMenu("WWV/Upload Coverage Cache")]
        public void UploadCoverage()
        {
            StartCoroutine(UploadCoverageCoroutine());
        }

        public IEnumerator UploadCoverageCoroutine()
        {
            if (config == null)
            {
                Debug.LogError("[WwvCoverageExporter] config required");
                yield break;
            }

            var url = config.wwvBaseUrl.TrimEnd('/') + "/api/niantic/coverage/cache";
            var body = Encoding.UTF8.GetBytes(geoJsonFeatureCollection);

            using var req = new UnityWebRequest(url, "POST");
            req.uploadHandler = new UploadHandlerRaw(body);
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            if (!string.IsNullOrEmpty(config.uploadSecret))
            {
                req.SetRequestHeader("x-wwv-niantic-upload-secret", config.uploadSecret);
            }

            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("[WwvCoverageExporter] " + req.error);
                yield break;
            }

            Debug.Log("[WwvCoverageExporter] " + req.downloadHandler.text);
        }
    }
}
