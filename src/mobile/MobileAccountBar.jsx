import {
  Box,
  Typography,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";

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
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Select
        size="small"
        value={selectedAccountId || ""}
        onChange={(e) => setSelectedAccountId(e.target.value)}
        displayEmpty
        disabled={accountsLoading || accounts.length === 0}
        MenuProps={{
          disableScrollLock: true,
          PaperProps: {
            sx: { zIndex: 2000 }
          }
        }}
        sx={{
          flex: 1,
          backgroundColor: "#0f172a",
          color: "#e5e7eb",
        }}
      >
        <MenuItem value="" disabled>
          Select account
        </MenuItem>

        {accounts.map((acc) => (
          <MenuItem key={acc.id} value={acc.id}>
            {acc.name}
          </MenuItem>
        ))}
      </Select>

      <Chip
        size="small"
        label={isConnected ? "Connected" : "Web connected"}
        color={isConnected ? "success" : "default"}
        variant="outlined"
      />
    </Box>
  );
}
