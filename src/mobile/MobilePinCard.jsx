import { Box, Typography, Chip } from "@mui/material";

export default function MobilePinCard({ pin }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        mb: 2,
        p: 1.5,
        borderRadius: 2,
        backgroundColor: "#0f172a",
      }}
    >
      {pin.image_url && (
        <img
          src={pin.image_url}
          alt=""
          style={{
            width: 60,
            height: 90,
            objectFit: "cover",
            borderRadius: 6,
          }}
        />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {pin.title || "Untitled"}
        </Typography>

        <Typography variant="caption" color="text.secondary" noWrap>
          {pin.board_name || "—"}
        </Typography>

        <Chip
          size="small"
          label={pin.status}
          color={
            pin.status === "posted"
              ? "success"
              : pin.status === "failed"
              ? "error"
              : "primary"
          }
          sx={{ mt: 0.5 }}
        />
      </Box>
    </Box>
  );
}
