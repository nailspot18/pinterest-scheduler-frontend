import { Box } from "@mui/material";
import MobileAccountBar from "./MobileAccountBar";
import MobileDateSelector from "./MobileDateSelector";
import MobilePinStatus from "./MobilePinStatus";

export default function MobileDashboard({
  accounts,
  accountsLoading,
  selectedAccountId,
  setSelectedAccountId,
  isConnected,
  selectedDate,
  setSelectedDate,
  pins,
  pinsLoading,
}) {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#020617",
      }}
    >
      <MobileAccountBar
        accounts={accounts}
        accountsLoading={accountsLoading}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        isConnected={isConnected}
      />

      <MobileDateSelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />

      <MobilePinStatus pins={pins} pinsLoading={pinsLoading} />
    </Box>
  );
}
