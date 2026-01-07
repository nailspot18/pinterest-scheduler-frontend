import { Box, Typography, Chip } from "@mui/material";

export default function MobileAccountBar({
  accounts,
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


      <Box sx={{ display: "flex", gap: 1, overflowX: "auto" }}>
        {accounts.map((acc) => (
          <Box
            key={acc.id}
            onClick={() => setSelectedAccountId(acc.id)}
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
    </Box>
  );
}
