using System;
using System.Collections;
using System.IO;
using UnityEngine;
using UnityEngine.Networking;

namespace WWV.AR
{
    /// <summary>
    /// Uploads a GLB file for a VPS site to WorldWideView POST /api/niantic/mesh.
    /// Assign siteId and glb path after exporting from your mesh pipeline.
    /// </summary>
    public class WwvMeshExporter : MonoBehaviour
    {
        public WwvConfig config;
        public string siteId = "";
        public string glbFilePath = "";
        public double latitude;
        public double longitude;
        public double altitudeMeters;
        public double headingDeg;

        [ContextMenu("WWV/Upload Mesh GLB")]
        public void UploadMesh()
        {
            StartCoroutine(UploadMeshCoroutine());
        }

        public IEnumerator UploadMeshCoroutine()
        {
            if (config == null || string.IsNullOrEmpty(siteId) || string.IsNullOrEmpty(glbFilePath))
            {
                Debug.LogError("[WwvMeshExporter] config, siteId, and glbFilePath are required");
                yield break;
            }

            if (!File.Exists(glbFilePath))
            {
                Debug.LogError("[WwvMeshExporter] GLB not found: " + glbFilePath);
                yield break;
            }

            var bytes = File.ReadAllBytes(glbFilePath);
            var transform = JsonUtility.ToJson(new TransformPayload
            {
                lat = latitude,
                lng = longitude,
                alt = altitudeMeters,
                headingDeg = headingDeg,
            });

            var url = config.wwvBaseUrl.TrimEnd('/') + "/api/niantic/mesh";
            var form = new WWWForm();
            form.AddField("siteId", siteId);
            form.AddField("transform", transform);
            form.AddBinaryData("file", bytes, Path.GetFileName(glbFilePath), "model/gltf-binary");

            using var req = UnityWebRequest.Post(url, form);
            if (!string.IsNullOrEmpty(config.uploadSecret))
            {
                req.SetRequestHeader("x-wwv-niantic-upload-secret", config.uploadSecret);
            }

            yield return req.SendWebRequest();

            if (req.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("[WwvMeshExporter] Upload failed: " + req.error + " " + req.downloadHandler.text);
                yield break;
            }

            Debug.Log("[WwvMeshExporter] Upload OK: " + req.downloadHandler.text);
        }

        [Serializable]
        private class TransformPayload
        {
            public double lat;
            public double lng;
            public double alt;
            public double headingDeg;
        }
    }
}
