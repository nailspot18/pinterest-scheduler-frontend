import { Box, Typography, Chip, CircularProgress } from "@mui/material";

export default function MobileAccountBar({
  accounts,
  accountsLoading,
  selectedAccountId,
  setSelectedAccountId,
  isConnected,
}) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: "1px solid #1f2937",
      }}
    >
      {/* Header row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography fontSize={14} color="#9ca3af">
          Account
        </Typography>

        <Chip
          size="small"
          label={isConnected ? "Connected" : "Offline"}
          color={isConnected ? "success" : "error"}
          variant="outlined"
        />
      </Box>

      {/* 🔌 Not connected → show connect CTA */}
      {!isConnected && (
        <Box
          onClick={() => {
            window.location.href = `${import.meta.env.VITE_BACKEND_URL}/login`;
          }}
          sx={{
            mt: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            textAlign: "center",
            fontSize: 13,
            cursor: "pointer",
            backgroundColor: "#1d4ed8",
            color: "white",
          }}
        >
          Connect Pinterest Account
        </Box>
      )}

      {/* ⏳ Connected but loading accounts */}
      {isConnected && accountsLoading && (
        <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={18} />
        </Box>
      )}

      {/* ✅ Connected + accounts exist → show account chips */}
      {isConnected && !accountsLoading && accounts.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", mt: 1 }}>
          {accounts.map((acc) => (
            <Box
              key={acc.id}
              onClick={async () => {
                try {
                  await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/accounts/switch`,
                    {
                      method: "POST",
                      credentials: "include",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ account_id: acc.id }),
                    }
                  );

                  setSelectedAccountId(acc.id);
                } catch (e) {
                  console.error("Mobile account switch failed", e);
                }
              }}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                fontSize: 13,
                whiteSpace: "nowrap",
                cursor: "pointer",
                border: "1px solid",
                borderColor:
                  selectedAccountId === acc.id ? "#22c55e" : "#374151",
                backgroundColor:
                  selectedAccountId === acc.id ? "#052e16" : "#020617",
                color:
                  selectedAccountId === acc.id ? "#22c55e" : "#e5e7eb",
              }}
            >
              {acc.name}
            </Box>
          ))}
        </Box>
      )}

      {/* ⚠️ Connected but no accounts (edge case) */}
      {isConnected && !accountsLoading && accounts.length === 0 && (
        <Typography
          fontSize={12}
          color="#9ca3af"
          sx={{ mt: 1, textAlign: "center" }}
        >
          No accounts found
        </Typography>
      )}
    </Box>
  );
}
