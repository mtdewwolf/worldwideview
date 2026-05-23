"use client";

import { ApiKeysTab } from "./ApiKeysTab";

interface ApiKeysModalProps {
    onClose: () => void;
}

export function ApiKeysModal({ onClose }: ApiKeysModalProps) {
    return (
      <div
        style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "5vh",
            paddingBottom: "5vh",
            overflowY: "auto",
            zIndex: 9999,
        }}
        onClick={onClose}
      >
        <div
          className="glass-panel"
          onClick={(e) => e.stopPropagation()}
          style={{
                width: "min(700px, 90vw)",
                maxHeight: "80vh",
                overflowY: "auto",
                padding: "24px",
                borderRadius: "16px",
                margin: "20px",
            }}
        >
          <div
            style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                }}
          >
            <h2 style={{ margin: 0 }}>API Keys</h2>
            <button type="button" className="btn" onClick={onClose}>
              Close
            </button>
          </div>
          <ApiKeysTab />
        </div>
      </div>
    );
}
