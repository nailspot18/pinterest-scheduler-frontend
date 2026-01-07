import { Box, Typography } from "@mui/material";
import MobilePinCard from "./MobilePinCard";

export default function MobilePinStatus({ pins, pinsLoading }) {
  if (pinsLoading) {
    return <Typography sx={{ p: 2 }}>Loading pins…</Typography>;
  }

  if (!pins || pins.length === 0) {
    return <Typography sx={{ p: 2 }}>No pins for this date</Typography>;
  }

  return (
    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
      {pins.map((pin, idx) => (
        <MobilePinCard key={pin.id || idx} pin={pin} />
      ))}
    </Box>
  );
}
