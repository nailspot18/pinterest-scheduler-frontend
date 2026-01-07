import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export default function MobileDateSelector({ selectedDate, setSelectedDate }) {
  function shiftDate(days) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  }

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1f2937",
      }}
    >
      <IconButton onClick={() => shiftDate(-1)}>
        <ChevronLeftIcon />
      </IconButton>

      <Typography fontWeight={500}>
        {selectedDate.toDateString()}
      </Typography>

      <IconButton onClick={() => shiftDate(1)}>
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}
