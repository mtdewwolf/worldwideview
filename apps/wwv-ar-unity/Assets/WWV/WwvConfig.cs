using UnityEngine;

namespace WWV.AR
{
    /// <summary>
    /// Configure WorldWideView server URL and mesh upload secret (matches WWV .env.local).
    /// </summary>
    [CreateAssetMenu(fileName = "WWVConfig", menuName = "WWV/Config")]
    public class WwvConfig : ScriptableObject
    {
        [Tooltip("WorldWideView origin, e.g. http://localhost:3000")]
        public string wwvBaseUrl = "http://localhost:3000";

        [Tooltip("Matches NIANTIC_MESH_UPLOAD_SECRET or WWV_BRIDGE_TOKEN on the server")]
        public string uploadSecret = "";

        [Tooltip("Session cookie value for /api/niantic/token (editor testing)")]
        public string sessionCookie = "";
    }
}
