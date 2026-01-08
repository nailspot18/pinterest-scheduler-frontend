import React, { useEffect, useState, useRef, useMemo } from 'react'
import {
  Box, Container, Button, TextField, MenuItem, Typography, Paper,
  Select, InputLabel, FormControl, LinearProgress, IconButton
} from '@mui/material'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CloseIcon from '@mui/icons-material/Close'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Autocomplete } from "@mui/material";
import MobileDashboard from "./mobile/MobileDashboard";





// Backend base URL (local or production via env)
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
console.log("BACKEND USED BY FRONTEND =", BACKEND);



function formatDate(d) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function generateDays() {
  const days = []
  const now = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    days.push(d)
  }
  return days
}

function buildTimeSlots() {
  const slots = []
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {              // later chane it to 30 min >>>>>>>       for (let m of [0, 30]) {        <<<<<<<<<<          >>>>>>>>>this is for every min   ----- for (let m = 0; m < 60; m++) {   -------<<<<<<<<
      const hour = h % 12 === 0 ? 12 : h % 12
      const ampm = h < 12 ? 'AM' : 'PM'
      slots.push(`${hour}:${String(m).padStart(2,'0')} ${ampm}`)
    }
  }
  return slots
}

  // Precompute to keep initial state deterministic
  const INITIAL_DAYS = generateDays()
  const INITIAL_SLOTS = buildTimeSlots()


  function formatToIST(dateInput) {
    if (!dateInput) return "—";
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      background: {
        default: '#0f172a',   // slate-900
        paper: '#020617',     // near-black
      },
      primary: {
        main: '#3b82f6',      // blue-500
      },
      secondary: {
        main: '#22c55e',      // green-500
      },
    },
  })



  export default function App() {     
    const [boards, setBoards] = useState([])
    const days = useMemo(() => INITIAL_DAYS, [])
    const timeSlots = useMemo(() => INITIAL_SLOTS, [])
    const [selectedDate, setSelectedDate] = useState(days[0])
    const [selectedTime, setSelectedTime] = useState("");
    const [form, setForm] = useState({ title: '', description: '', link: '', board_id: '', image_url: '' })
    const [refreshKey, setRefreshKey] = useState(0)
    const [submitting, setSubmitting] = useState(false) 
    const [datePinCache, setDatePinCache] = useState({}) // keys: 'YYYY-MM-DD' -> array of pins for that date
    const [imageKey, setImageKey] = useState(0);
    const [drafts, setDrafts] = useState([])
    const [activeDraftMenu, setActiveDraftMenu] = useState(null)
    const [editingDraftId, setEditingDraftId] = useState(null)
    const [editingScheduledPin, setEditingScheduledPin] = useState(null)
    const isMobile = window.innerWidth < 768;
    




    // ===== ACCOUNT SWITCHER STATE =====
    const [accounts, setAccounts] = useState([])
    const [selectedAccountId, setSelectedAccountId] = useState(null)
    const [accountsLoading, setAccountsLoading] = useState(false)


    
    const pins = useMemo(() => {
      if (!selectedDate) return []

      const key = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

      return datePinCache[key] || []
    }, [datePinCache, selectedDate])



    // drag/drop state
    const [dragOver, setDragOver] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadError, setUploadError] = useState(null)
    const fileInputRef = useRef(null)
    const [localPreview, setLocalPreview] = useState(null);


    // Loading states
    const [boardsLoading, setBoardsLoading] = useState(false)
    const [pinsLoading, setPinsLoading] = useState(false)

    const [isConnected, setIsConnected] = useState(false);

    const accountReady = Boolean(isConnected && selectedAccountId)

   
    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await fetch(`${BACKEND}/auth/status`, {
            credentials: "include",
          });
          const data = await res.json();
          console.log("AUTH STATUS:", data);
          setIsConnected(Boolean(data.connected));
        } catch (e) {
          console.error("Auth check failed:", e);
          setIsConnected(false);
        }
      };

      const params = new URLSearchParams(window.location.search);

      if (params.get("auth") === "success") {
        checkAuth();
        // 🔥 clean URL so refreshes don’t repeat logic
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        checkAuth();
      }
    }, []);



    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await fetch(`${BACKEND}/auth/status`, {
            credentials: "include",
          });
          const data = await res.json();
          console.log("AUTH STATUS:", data);
          setIsConnected(Boolean(data.connected));
        } catch (e) {
          console.error("Auth check failed:", e);
          setIsConnected(false);
        }
      };

      const params = new URLSearchParams(window.location.search);

      if (params.get("auth") === "success") {
        checkAuth();
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        checkAuth();
      }
    }, []);



    function normalizeRemoteUrl(url) {
      if (!url) return "";
      return url;
    }

    // ===== FETCH CONNECTED ACCOUNTS =====
    useEffect(() => {
      // 🔒 If not connected yet, just wait — DO NOT clear state
      if (!isConnected) return

      let cancelled = false
      setAccountsLoading(true)

      fetch(`${BACKEND}/accounts`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (cancelled) return
          if (!data || !Array.isArray(data.accounts)) return

          setAccounts(data.accounts)

          // ✅ RESTORE active account ONLY from backend session
          if (data.active_account_id) {
            setSelectedAccountId(data.active_account_id)
          }
          // ❌ DO NOT auto-pick first account
        })
        .catch(err => {
          console.error("Accounts fetch failed", err)
          // ❌ do NOT clear accounts here either
        })
        .finally(() => {
          if (!cancelled) setAccountsLoading(false)
        })

      return () => { cancelled = true }
    }, [isConnected])



    useEffect(() => {
      function handleClickOutside() {
        setActiveDraftMenu(null);
      }

      if (activeDraftMenu !== null) {
        document.addEventListener("click", handleClickOutside);
      }

      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }, [activeDraftMenu]);



    
    // ===== HARD RESET ON ACCOUNT SWITCH =====
    useEffect(() => {
      if (!selectedAccountId) return

      console.log("Switched to account:", selectedAccountId)

      // 🔥 clear all account-scoped data
      setBoards([])
      setDrafts([])
      setDatePinCache({})
      setSelectedDate(days[0])

      // force refetch everywhere
      setRefreshKey(k => k + 1)
    }, [selectedAccountId])


    // Fetch boards (from backend) on mount
    useEffect(() => {
      if (!isConnected || !selectedAccountId) {
        setBoards([]);
        setBoardsLoading(false);
        return;
      }
    
      let cancelled = false;
      setBoardsLoading(true);

      fetch(`${BACKEND}/boards`, {
        credentials: "include",
      })
        .then(async res => {
          if (res.status === 401) {
            setIsConnected(false);
            setBoards([]);
            setBoardsLoading(false);

            // 🔥 force backend + frontend sync
            await fetch(`${BACKEND}/auth/status`, {
              credentials: "include",
            });

            return null;
          }

          if (!res.ok) {
            throw new Error(await res.text());
          }

          return res.json();
        })
        
        .then(data => {
          if (cancelled || !data) return;

          const boardsList = Array.isArray(data) ? data : data?.items || [];

          setBoards(boardsList);

          // =========================
          // ✅ FETCH DRAFTS (PART 6)
          // =========================
          fetch(`${BACKEND}/drafts`, {
            credentials: "include",
          })
            .then(res => res.json())
            .then(draftsData => {
              if (!cancelled && Array.isArray(draftsData)) {
                setDrafts(draftsData);
              }
            })
            .catch(err => {
              console.error("Drafts fetch failed:", err);
              if (!cancelled) setDrafts([]);
            });
        })

        .catch(err => {
          console.error("Boards fetch failed:", err);
          if (!cancelled) setBoards([]);
        })
        .finally(() => {
          if (!cancelled) setBoardsLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [isConnected, selectedAccountId]);


    // Fetch scheduled pins for selected date (re-runs when selectedDate OR refreshKey changes)
    useEffect(() => {
      // 🔒 do not fetch until auth is confirmed
      if (!selectedDate || !isConnected) return;

      fetchScheduledForDate(selectedDate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, refreshKey, isConnected]);


    // 🔁 Auto-refresh pin status every 60 seconds (no page refresh needed)
    useEffect(() => {
      if (!isConnected || !selectedDate) return;

      const interval = setInterval(() => {
        fetchScheduledForDate(selectedDate);
      }, 60_000); // 1 minute

      return () => clearInterval(interval);
    }, [isConnected, selectedDate]);


    function dayKeyFromDate(date) {
      if (!date) return null;
      const d = (date instanceof Date) ? date : new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

   
    // Re-evaluate posted state regularly so UI flips Scheduled -> Posted and ordering updates automatically

    // Ensure selectedTime remains valid when selectedDate changes (or when time passes)
    useEffect(() => {
      try {
        const slots = allowedTimeSlots()
        if (!slots || slots.length === 0) return
        // if current selectedTime not in allowed list, set it to the first allowed slot
        if (selectedTime === "") return;
        if (!slots.includes(selectedTime)) {
          setSelectedTime(slots[0])
        }
      } catch (e) {
        // ignore
      }
    // re-run when selectedDate changes or when user reloads timeSlots array
    }, [selectedDate, /* timeSlots is stable but include to be safe */])

    

    
    // Convert selected date + time string ("12:00 PM") -> UTC ISO string
    function toISO(date, timeStr) {
      const [time, ampm] = timeStr.split(" ");
      let [h, m] = time.split(":").map(Number);

      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      // 🔥 Build LOCAL datetime string (NO UTC conversion)
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(h).padStart(2, "0");
      const min = String(m).padStart(2, "0");

      // ✅ This is interpreted as IST by backend
      return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
    }




    // Normalize a Date (or date-like) to a Date at local midnight (so comparisons by day work)
    function toLocalDateOnly(d) {
      if (!d) return null
      const dt = (d instanceof Date) ? d : new Date(d)
      if (isNaN(dt.getTime())) return null
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
    }

    // ---------------- helper: compare two dates by local day ----------------
    function isSameDay(a, b) {
      if (!a || !b) return false
      const da = (a instanceof Date) ? a : (parseServerDate(a) ? parseServerDate(a) : new Date(a))
      const db = (b instanceof Date) ? b : (parseServerDate(b) ? parseServerDate(b) : new Date(b))
      if (!da || !db || isNaN(da.getTime()) || isNaN(db.getTime())) return false
      return da.getFullYear() === db.getFullYear() &&
            da.getMonth() === db.getMonth() &&
            da.getDate() === db.getDate()
    }
    // -----------------------------------------------------------------------

    // ------------------ Time helpers ------------------

    // generate time slots every `stepMin` minutes (default 30) in "HH:MM" 24h format
    function generateTimeSlots(stepMin = 30) {
      const slots = []
      for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += stepMin) {
          const hh = String(h).padStart(2, '0')
          const mm = String(m).padStart(2, '0')
          slots.push(`${hh}:${mm}`)
        }
      }
      return slots
    }

    // return true if the selectedDate corresponds to today (local)
    function isSelectedDateToday(selectedDate) {
      if (!selectedDate) return false
      const now = new Date()
      return selectedDate.getFullYear() === now.getFullYear() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getDate() === now.getDate()
    }

    // return next available time slot (string "HH:MM") that is strictly after now
    function nextFutureSlot(stepMin = 30) {
      const now = new Date()
      // round up to next stepMin
      const totalMin = now.getHours() * 60 + now.getMinutes()
      const next = Math.ceil((totalMin + 1) / stepMin) * stepMin // +1 to avoid exact current minute
      const hh = Math.floor(next / 60)
      const mm = next % 60
      if (hh >= 24) return '23:59' // end of day fallback
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
    }

    // convert a time slot like "12:00 PM" to minutes since midnight (0-1439)
    function timeSlotToMinutes(slot) {
      if (!slot || typeof slot !== 'string') return 0
      // expected format "H:MM AM" or "HH:MM PM"
      const parts = slot.trim().split(' ')
      if (parts.length !== 2) {
        // fallback for "HH:MM" 24h format
        const [hh, mm] = slot.split(':').map(Number)
        return (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm)
      }
      const [time, ampm] = parts
      const [hStr, mStr] = time.split(':')
      let h = parseInt(hStr, 10)
      const m = parseInt(mStr || '0', 10)
      if (isNaN(h)) h = 0
      if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
      return h * 60 + (isNaN(m) ? 0 : m)
    }

    // return only slots allowed for the currently selectedDate.
    // If selectedDate is today, exclude slots that are at or before the current time.
    function allowedTimeSlots() {
      if (!Array.isArray(timeSlots) || timeSlots.length === 0) return []
      if (!selectedDate) return timeSlots
      // compare local date only
      const now = new Date()
      const isToday = selectedDate.getFullYear() === now.getFullYear()
        && selectedDate.getMonth() === now.getMonth()
        && selectedDate.getDate() === now.getDate()

      if (!isToday) return timeSlots

      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      // keep only strictly future slots
      const allowed = timeSlots.filter(s => timeSlotToMinutes(s) > nowMinutes)
      // if no allowed slots remain (late night), return last slot so the user can still pick something
      return allowed.length ? allowed : [timeSlots[timeSlots.length - 1]]
    }


    function loadDraft(d) {
  setForm({
    title: d.title || "",
    description: d.description || "",
    link: d.link || "",
    board_id: d.board_id || "",
    image_url: d.image_url || ""
  })

  setEditingDraftId(d.id) // 🔥 THIS IS KEY
}




    /**
     * Robust parser for timestamps returned by the backend.
     * Handles microseconds (trims to ms), missing timezone (assumes UTC),
     * and normal ISO strings. Returns a Date or null.
     */
    function parseServerDate(s) {
      if (!s) return null;
      if (s instanceof Date) return s;
      let t = String(s).trim();

      // Trim microseconds beyond milliseconds: "2025-12-06T08:36:03.798000" -> ".798"
      t = t.replace(/\.(\d{3})\d+/, '.$1');

      // If no timezone indicator (no 'Z' or +/-HH:MM), assume UTC and append 'Z'
      if (!/[zZ]$/.test(t) && !/[+\-]\d{2}:\d{2}$/.test(t)) {
        t = t + 'Z';
      }

      const dt = new Date(t);
      return isNaN(dt.getTime()) ? null : dt;
    }
    

    function isPinPosted(pin) {
      return pin?.status === "posted"
    }




    // ---------------- helper: counts for a calendar date ----------------
    // returns { scheduled: number, posted: number, total: number }
    function getCountsForDate(date) {
      if (!date) return { scheduled: 0, posted: 0, total: 0 }

      // build YYYY-MM-DD
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

      // -------------------------------------------
      // 1) If the user has clicked this date, ALWAYS
      //    use filteredPins for EXACT match.
      // -------------------------------------------
      if (selectedDate && isSameDay(date, selectedDate)) {
        let scheduled = 0, posted = 0
        filteredPins.forEach(p => {
          if (p._is_posted) posted++
          else scheduled++
        })
        return { scheduled, posted, total: scheduled + posted }
      }

      // -------------------------------------------
      // 2) Else if cached data exists → use that
      // -------------------------------------------
      if (datePinCache && datePinCache[key]) {
        const arr = datePinCache[key] || []
        let scheduled = 0, posted = 0
        arr.forEach(p => {
          if (isPinPosted(p)) posted++
          else scheduled++
        })
        return { scheduled, posted, total: scheduled + posted }
      }

      // -------------------------------------------
      // 3) Else fallback to localStorage
      // -------------------------------------------
      return { scheduled: 0, posted: 0, total: 0 }
    }



    
    // ------------------ REPLACE fetchScheduledForDate WITH THIS ------------------
    /**
     * Fetch scheduled pins for a given date, merge with locally saved pins (localStorage),
     * dedupe by id, normalize scheduled_at to ISO and Date, sort ascending by time, then setPins(...)
     *
     * Keeps local fallback pins persistent across refresh for the selected date.
     */
    async function fetchScheduledForDate(dateArg) {
      // accept either Date or string; normalize to Date
      const date = (dateArg instanceof Date) ? dateArg : (dateArg ? new Date(dateArg) : selectedDate)
      if (!date || isNaN(date.getTime())) {
        return;
      }


      const y = date.getFullYear()
      const mo = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const datePrefix = `${y}-${mo}-${d}` // YYYY-MM-DD
      

      setPinsLoading(true)
      try {
        // 1) fetch authoritative list from server for this date
        let serverList = []
        try {
          const res = await fetch(
            `${BACKEND}/scheduled?date=${datePrefix}`,
            { credentials: "include" }
          );

          // 🔥 FIX 2: scheduled endpoint must NOT disconnect UI
          if (res.status === 401) {
            console.warn("fetchScheduledForDate: 401 from /scheduled (ignoring)");
            serverList = [];
          } else if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }


          const data = await res.json()

          if (Array.isArray(data)) serverList = data
          else if (Array.isArray(data.value)) serverList = data.value
          else if (Array.isArray(data.items)) serverList = data.items
          else if (Array.isArray(data.data)) serverList = data.data
          else {
            const possible = Object.values(data).find(v => Array.isArray(v))
            if (possible) serverList = possible
          }
        } catch (e) {
          console.warn('fetchScheduledForDate: server fetch failed', e)
          serverList = []
        }



        // Normalize server items: ensure _scheduled_at_date is a Date object for comparisons
        serverList = (Array.isArray(serverList) ? serverList : []).map(it => {
          const dt =
            it._scheduled_at_date ||
            parseServerDate(it.scheduled_at)


          // ✅ TRUST BACKEND COMPLETELY — DO NOT TOUCH image_url
          return {
            ...it,
            image_url: it.image_url ?? null,
            _scheduled_at_date: dt
          }
        })



        // 3) merge, dedupe: serverList first (authoritative), then localList (only same-day fallbacks)
        // Use id when available; fall back to _local_key or generated key
        // attach board_name using existing boards list
        const boardMap = new Map((boards || []).map(b => [b.id, b.name || b.title || b.name]))
        
        
        const prevForDay = datePinCache[datePrefix] || []

        const merged = mergeAndDedupePins(
          serverList.map(p => {
            const prev = prevForDay.find(
              x =>
                (p.id && x.id === p.id) ||
                (p.client_id && x.client_id === p.client_id)
            )

            // 🔥 SERVER STATUS ALWAYS WINS
            if (p.status === "posted") {
              return {
                ...prev,
                ...p,
                status: "posted",
                _is_posted: true,
              }
            }

            const bname =
              p.board_name ||
              (p.board_id ? boardMap.get(p.board_id) : undefined)

            return {
              ...p,
              board_name: bname,
              _scheduled_at_date: parseServerDate(p.scheduled_at),
            }
          })
        )

        .map(p => {
          const bname =
            p.board_name ||
            (p.board_id ? boardMap.get(p.board_id) : undefined)

          return {
            ...p,
            board_name: bname
          }
        })



        // 4) set pins state STRICTLY to merged list (no carryover)

        
        // 5) cache by the same YYYY-MM-DD key so calendar counts are exact
        try {
          setDatePinCache(prevCache => ({
            ...(prevCache || {}),
            [datePrefix]: merged
          }));
        } catch (e) {
          // non-fatal
          console.warn('fetchScheduledForDate: failed to set cache', e);
        }

        } finally {
          setPinsLoading(false);
        }
      }


    async function duplicateDraft(id) {
      await fetch(`${BACKEND}/drafts/${id}/duplicate`, {
        method: "POST",
        credentials: "include",
      })
      const res = await fetch(`${BACKEND}/drafts`, {
        credentials: "include",
      })
      setDrafts(await res.json())
    }

    async function deleteDraft(id) {
      await fetch(`${BACKEND}/drafts/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      setDrafts(drafts.filter(d => d.id !== id))
    }


    async function deleteScheduledPin(pin) {
      if (!pin?.id) return;

      const dayKey = dayKeyFromDate(
        pin._scheduled_at_date ||
        parseServerDate(pin.scheduled_at)
      );

      try {
        const res = await fetch(`${BACKEND}/scheduled/${pin.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!res.ok) {
          console.warn("Failed to delete scheduled pin");
          return;
        }

        // 🔥 Remove pin instantly from UI
        setDatePinCache(prev => ({
          ...prev,
          [dayKey]: (prev[dayKey] || []).filter(p => p.id !== pin.id)
        }));
      } catch (e) {
        console.error("Delete scheduled pin failed", e);
      }
    }



   function editScheduledPin(pin) {
      if (!pin) return;

      // 1️⃣ Remove pin from Pin Status UI immediately
      const dayKey = dayKeyFromDate(
        pin._scheduled_at_date ||
        parseServerDate(pin.scheduled_at)
      );

      setDatePinCache(prev => ({
        ...prev,
        [dayKey]: (prev[dayKey] || []).filter(p => p.id !== pin.id)
      }));

      // 2️⃣ Populate form fields
      setForm({
        title: pin.title || "",
        description: pin.description || "",
        link: pin.link || "",
        board_id: pin.board_id || "",
        image_url: pin.image_url || ""
      });

      // 3️⃣ Restore date + time (IST-friendly)
      const dt =
        pin._scheduled_at_date ||
        parseServerDate(pin.scheduled_at);

      if (dt) {
        setSelectedDate(new Date(
          dt.getFullYear(),
          dt.getMonth(),
          dt.getDate()
        ));

        const hours = dt.getHours();
        const minutes = dt.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        const h12 = hours % 12 === 0 ? 12 : hours % 12;
        setSelectedTime(`${h12}:${String(minutes).padStart(2, "0")} ${ampm}`);
      }

      // 4️⃣ Mark this pin as being edited
      setEditingScheduledPin(pin);

      // ❌ ensure draft mode is OFF
      setEditingDraftId(null);
    }
 

    async function retryFailedPin(pin) {
      if (!pin) return;

      // schedule 1 minute in future
      const retryDate = new Date();
      retryDate.setMinutes(retryDate.getMinutes() + 1);
      retryDate.setSeconds(0, 0);

      const iso = retryDate.toISOString();
      const failedPinId = pin.id;

      try {
        const res = await fetch(`${BACKEND}/schedule`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: pin.title,
            description: pin.description,
            link: pin.link,
            board_id: pin.board_id,
            board_name: pin.board_name,
            image_url: pin.image_url,
            scheduled_at: iso,
          }),
        });

        if (!res.ok) {
          console.warn("Retry failed:", await res.text());
          return; // ❌ DO NOT delete failed pin
        }

        const body = await res.json();

        if (body?.scheduled_pin_id) {
          // ✅ SUCCESS → remove failed pin from UI
          const dayKey = dayKeyFromDate(
            pin._scheduled_at_date ||
            parseServerDate(pin.scheduled_at)
          );
          setDatePinCache(prev => ({
            ...prev,
            [dayKey]: (prev[dayKey] || []).filter(p => p.id !== failedPinId)
          }));
        }
      } catch (err) {
        console.error("Retry exception:", err);
      }
    }




    // ------------------ END REPLACEMENT ------------------

   // Helper: normalize, dedupe, sort, and annotate pins
    function mergeAndDedupePins(arr) {
      if (!Array.isArray(arr)) return []

      // 1) normalize entries (ensure _scheduled_at_iso and _scheduled_at_date)
      const normalized = arr.map((it) => {
        const copy = { ...(it || {}) }

        // 1) prefer explicit _scheduled_at_iso
        if (!copy._scheduled_at_iso) {
          if (typeof copy.scheduled_at === "string") {
            copy._scheduled_at_iso = copy.scheduled_at
          } else if (typeof copy.scheduledAt === "string") {
            copy._scheduled_at_iso = copy.scheduledAt
          } else if (copy._scheduled_at_date instanceof Date) {
            copy._scheduled_at_iso = copy._scheduled_at_date.toISOString()
          }
        }

        // 2) ensure _scheduled_at_date is a Date (UTC-safe)
        if (!copy._scheduled_at_date) {
          copy._scheduled_at_date =
            parseServerDate(copy._scheduled_at_iso) ||
            parseServerDate(copy.scheduled_at) ||
            null
        } else if (!(copy._scheduled_at_date instanceof Date)) {
          copy._scheduled_at_date = parseServerDate(copy._scheduled_at_date)
        }

        return copy
      })


      // 2) dedupe: use maps so ANY key (id, client_id, _local_key, fallback) maps
      const keyToPrimary = new Map()   // any key -> primaryKey
      const primaryToItem = new Map()  // primaryKey -> item

      function makeKeys(it) {
        const keys = []
        if (it.id) keys.push(`id:${it.id}`)
        if (it.client_id) keys.push(`client:${it.client_id}`)
        if (it._local_key) keys.push(`local:${it._local_key}`)
        const fb = `f:${it._scheduled_at_iso || ''}:${(it.title || '').slice(0, 40)}`
        keys.push(fb)
        return keys
      }

      for (const it of normalized) {
        const keys = makeKeys(it)

        // see if any key is already mapped to a primary
        let foundPrimary = null
        for (const k of keys) {
          if (keyToPrimary.has(k)) {
            foundPrimary = keyToPrimary.get(k)
            break
          }
        }

        if (foundPrimary) {
          const existing = primaryToItem.get(foundPrimary)
          const existingIsServer = !!existing && !!existing.id
          const incomingIsServer = !!it.id

          // resolution: server wins, otherwise newer wins
          if (existingIsServer && !incomingIsServer) {            
            continue
          } else {
            primaryToItem.set(foundPrimary, {
              ...existing,
              ...it,

              // 🔥 ABSOLUTE RULE: NEVER lose image_url
              image_url: existing.image_url || it.image_url || null,
            })
                        
            for (const k of keys) keyToPrimary.set(k, foundPrimary)
          }
        } else {
          // new canonical key: choose primary (prefer id, then client, then local, else fallback)
          const primaryKey = keys.find(k => k.startsWith('id:')) ||
                            keys.find(k => k.startsWith('client:')) ||
                            keys.find(k => k.startsWith('local:')) ||
                            keys[keys.length - 1] // fallback
          primaryToItem.set(primaryKey, it)
          for (const k of keys) keyToPrimary.set(k, primaryKey)
        }
      }

      // 3) produce array and sort ascending by scheduled date (nulls at end)
      const out = Array.from(primaryToItem.values()).sort((a, b) => {
        const ta = a._scheduled_at_date ? a._scheduled_at_date.getTime() : Number.POSITIVE_INFINITY
        const tb = b._scheduled_at_date ? b._scheduled_at_date.getTime() : Number.POSITIVE_INFINITY
        return ta - tb
      })

      // 4) annotate runtime fields: _is_posted and display_pin_count
      const finalized = out.map((it) => {
        const posted = (typeof isPinPosted === 'function') ? isPinPosted(it) : false
        const display_pin_count = (typeof it.pin_count !== 'undefined') ? it.pin_count : 0
        return { ...it, _is_posted: posted, display_pin_count }
      })

      return finalized
    }

    // Handle file selection or drop
    function handleFiles(files) {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setUploadError("Only image files are supported");
        return;
      }

      setUploadError(null);

      // ✅ SAFE PREVIEW: revoke old blob URL before creating new one
      const previewUrl = URL.createObjectURL(file);
      setLocalPreview(prev => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return previewUrl;
      });

      uploadFile(file);
    }

    async function uploadFile(file) {
      // 🔒 GUARD: account must be selected before upload
      if (!selectedAccountId) {
        setUploadError("Please select an account first");
        setUploading(false);
        return;
      }
      setUploading(true)
      setUploadProgress(0)
      setUploadError(null)

      // Try backend upload first (xhr to track progress)
      try {
        const uploadUrl = `${BACKEND.replace(/\/$/, '')}/upload`
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', uploadUrl)
          xhr.responseType = 'json'
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const body = xhr.response
              if (body && body.ok && body.url) {
                const normalized = normalizeRemoteUrl(body.url)

                setForm(f => ({ ...f, image_url: normalized }));
                setImageKey(k => k + 1); // 🔥 force img remount
                setUploading(false)
                setUploadProgress(100)
                resolve()
                return
              }
              reject(new Error('Invalid upload response'))
              return
            }
            reject(new Error(`Upload failed status ${xhr.status}`))
          }
          xhr.onerror = () => reject(new Error('Upload network error'))
          const fd = new FormData()
          fd.append('file', file)
          xhr.send(fd)
        })
        return
      } catch (err) {
        // Fall through to data URL fallback
        console.warn('Backend upload failed, falling back to data URL:', err)
        setUploadError('Upload to server failed — using local image preview (scheduling will embed image).')
      }

      // Fallback: read as data URL
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = (e) => reject(e)
          reader.readAsDataURL(file)
        })
        setForm(f => ({ ...f, image_url: dataUrl }))
        setUploadProgress(100)
      } catch (err) {
        setUploadError('Failed to read image locally')
      } finally {
        setUploading(false)
      }
    }

    // Drag handlers
    function onDragOver(e) { e.preventDefault(); e.stopPropagation(); setDragOver(true) }
    function onDragLeave(e) { e.preventDefault(); e.stopPropagation(); setDragOver(false) }
    function onDrop(e) { e.preventDefault(); e.stopPropagation(); setDragOver(false); const dt = e.dataTransfer; if (dt && dt.files && dt.files.length) handleFiles(dt.files) }

    function onFileInputChange(e) { const files = e.target.files; handleFiles(files); e.target.value = '' }

    function removeImage() {
      setForm(f => ({ ...f, image_url: '' })); 
      setLocalPreview(null);
      setUploadProgress(0); 
      setUploadError(null) 
    }

    function resetForm() {
      setForm(prev => ({
        ...prev,              // ✅ PRESERVE board_id
        title: "",
        description: "",
        link: "",
        image_url: ""
      }));

      // clear image / upload UI
      setLocalPreview(null);
      setUploadProgress(0);
      setUploading(false);

      // clear scheduling UI
      setSelectedTime("");     // keep empty string (controlled)
      setSubmitting(false);

      // force image input remount
      setImageKey(k => k + 1);
    }



    // --- CLEAN & CORRECT schedule handler ---
    async function handleSchedule(payload) {
      setUploading(true);

      const scheduledAt = payload.scheduled_at;
      const clientId = `local_schedule_${Date.now()}`;
      

      const scheduledDateObj = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );

      const dayKey = dayKeyFromDate(scheduledDateObj);


      const boardMap = new Map(boards.map(b => [b.id, b.name]));

      const optimisticItem = {
        client_id: clientId,
        title: payload.title || "",
        description: payload.description || "",
        link: payload.link || "",
        board_id: payload.board_id,
        board_name: boardMap.get(payload.board_id),
        image_url: payload.image_url
          ? normalizeRemoteUrl(payload.image_url)
          : null,
        
          scheduled_at: scheduledAt,
        status: "scheduled",
      };

      // ---- optimistic UI ----
      setDatePinCache(prev => ({
        ...prev,
        [dayKey]: mergeAndDedupePins([
          optimisticItem,
          ...(prev[dayKey] || [])
        ])
      }))

      resetForm();

      try {
        const res = await fetch(`${BACKEND}/schedule`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            draft_id: editingDraftId,
            scheduled_pin_id: editingScheduledPin?.id || null, // 🔥 KEY
            title: payload.title,
            description: payload.description,
            link: payload.link,
            board_id: payload.board_id,
            board_name: boardMap.get(payload.board_id),
            image_url: payload.image_url,
            scheduled_at: scheduledAt,
          }),
        });

        if (!res.ok) {
          console.warn("schedule failed", await res.text());
          //setRefreshKey(k => k + 1);  for demo
          return;
        }

        const body = await res.json();

        if (body?.scheduled_pin_id) {
          // 🔥 REMOVE draft from drafts list
          if (editingDraftId) {
            setDrafts(prev => prev.filter(d => d.id !== editingDraftId))
            setEditingDraftId(null)
          }
          if (editingScheduledPin) {
            setEditingScheduledPin(null)
          }



          const dayKey = dayKeyFromDate(
            parseServerDate(body.scheduled_at || scheduledAt)
          );


          setDatePinCache(prev => ({
            ...prev,
            [dayKey]: mergeAndDedupePins(
              (prev[dayKey] || []).map(p =>
                p.client_id === clientId
                  ? {
                      ...p,
                      id: body.scheduled_pin_id,
                      scheduled_at: body.scheduled_at,
                      _scheduled_at_iso: body.scheduled_at,
                      _scheduled_at_date: parseServerDate(body.scheduled_at),
                      status: "scheduled",
                    }
                  : p
              )
            )
          }));

        } else {
          //setRefreshKey(k => k + 1); demo
        }

      } catch (e) {
        console.warn("schedule API error", e);
        //setRefreshKey(k => k + 1); demo
      } finally {
        setUploading(false);
      }
    }


    async function handlePostNow(payload) {
      const now = new Date();
      const isoNow = now.toISOString();
      const clientId = `local_post_${Date.now()}`;
      

      const localKey = `${payload.board_id || "board"}:${isoNow}:${(payload.title || "").slice(0, 40)}`;
      
      const boardMap = new Map(boards.map(b => [b.id, b.name]));

      const optimisticItem = {
        id: clientId,
        _local_key: localKey,
        client_id: clientId,
        account_id: selectedAccountId,
        title: payload.title || "",
        description: payload.description || "",
        link: payload.link || "",
        board_id: payload.board_id,
        board_name: boardMap.get(payload.board_id),
        image_url: payload.image_url
          ? normalizeRemoteUrl(payload.image_url)
          : null,

        scheduled_at: isoNow,
        _scheduled_at_iso: isoNow,
        _scheduled_at_date: now,
        status: "posted",
        _is_posted: true,
        display_pin_count: typeof payload.pin_count !== "undefined" ? payload.pin_count : 0,
      };


      // ---- optimistic UI update ----
      const dayKey = dayKeyFromDate(new Date());


      setDatePinCache(prev => {
        const prevForDay = prev?.[dayKey] || [];

        return {
          ...(prev || {}),
          [dayKey]: mergeAndDedupePins([
            optimisticItem,
            ...prevForDay
          ])
        };
      });



      try {
        const res = await fetch(`${BACKEND}/post_now`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            draft_id: editingDraftId,
            client_id: clientId,
            title: payload.title,
            description: payload.description,
            link: payload.link,
            board_id: payload.board_id,
            board_name: boardMap.get(payload.board_id),
            image_url: payload.image_url,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.warn("post_now API returned non-ok", res.status, text);
          
          //setRefreshKey(k => k + 1); demo
          resetForm();
          return;
        }

        const body = await res.json();

        if (body && body.ok && body.scheduled_pin_id) {
          // 🔥 REMOVE draft from drafts list
          if (editingDraftId) {
            setDrafts(prev => prev.filter(d => d.id !== editingDraftId))
            setEditingDraftId(null)
          }



          const postedDate = new Date(body.scheduled_at || isoNow);


          const serverItem = {
            ...optimisticItem,
            id: body.scheduled_pin_id,
            client_id: body.client_id || clientId,
            status: "posted",
            image_url: body.image_url || optimisticItem.image_url,            
            scheduled_at: body.scheduled_at || optimisticItem.scheduled_at,
            _scheduled_at_iso: body.scheduled_at || optimisticItem._scheduled_at_iso,
            _scheduled_at_date: postedDate,
            board_name: optimisticItem.board_name || boardMap.get(payload.board_id),
            _is_posted: true,
            
          };

          
          const dayKey = dayKeyFromDate(
            parseServerDate(body.scheduled_at || isoNow)
          );


          setDatePinCache(prev => ({
            ...prev,
            [dayKey]: mergeAndDedupePins([
              serverItem,
              ...(prev[dayKey] || []).filter(
                p => p.client_id !== clientId && p._local_key !== localKey
              )
            ])
          }));

          
          resetForm();
        }
          
          

      } catch (e) {
        console.warn("post_now API call failed (optimistic UI used)", e);
        //setRefreshKey(k => k + 1); demo
        resetForm();
      }
    }

    
    const hasImage = Boolean(form.image_url)
    const scheduleDisabled = uploading || !hasImage

    // base numbered pins (keeps numbering consistent)
    const numberedPins = (Array.isArray(pins) ? pins : []).map(
      (p, i) => ({ ...p, _pin_number: i + 1 })
    )

    // ✅ NO EXTRA FILTERING — pins are already date-specific
    const filteredPins = numberedPins


    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Container
          maxWidth="xl"
          className="py-6"
          style={{ height: "100vh", overflow: "hidden" }}
        >
        <Box className="flex items-center justify-between mb-6">
          <Box>
            <Typography variant="h4" fontWeight={400}>
              Nailspot Pin Scheduler
            </Typography>
          </Box>
        </Box>    
        
          {isMobile ? (
            <MobileDashboard
              accounts={accounts}
              accountsLoading={accountsLoading}
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              isConnected={isConnected}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              pins={filteredPins}
              pinsLoading={pinsLoading}
            />
          ) : (
            <Box
              className="grid grid-cols-12 gap-6"
              style={{
                height: "100%",
                overflow: "hidden",
              }}
            >
          <Paper
            elevation={1}
            sx={{ borderRadius: 2 }}
            className="col-span-3 p-0 flex flex-col"
            style={{
              height: "100%",
              overflow: "hidden",
            }}
          >
            <div
              className="p-4 border-b"
              style={{ height: "45%", display: "flex", flexDirection: "column" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarTodayIcon />
                <Typography variant="h6">30-Day Calendar</Typography>
              </div>
              <div
                className="space-y-2 calendar-container"
                role="list"
                style={{ overflowY: "auto", flex: 1 }}
              >
                {days.map((d, i) => {
                  const isSelected = selectedDate && selectedDate.toDateString() === d.toDateString()
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDate(d)
                      }}
                      
                      
                      aria-pressed={isSelected}
                      className={`w-full text-left p-2 rounded-md transition-colors ${isSelected ? 'bg-gray-700 text-gray-100 font-semibold': 'hover:bg-gray-800 text-gray-300'}`}>
                      <div className="font-semibold">{formatDate(d)}</div>
                      {/* Counts for this date */}
                      {(() => {
                        const counts = getCountsForDate(d)
                        return (
                          <div className="text-sm text-white-500 mt-1">
                            <div className="text-xs">Scheduled: <span className="font-semibold">{counts.scheduled}</span></div>
                            <div className="text-xs">Posted: <span className="font-semibold">{counts.posted}</span></div>
                            <div className="text-xs">Total: <span className="font-semibold">{counts.total}</span></div>
                          </div>
                        )
                      })()}
                    </button>
                  )
                })}
              </div>
            </div>


          
            {/* ================== DRAFTS SECTION ================== */}
              
              <div
                className="p-4"
                style={{ flex: 1, display: "flex", flexDirection: "column" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Typography variant="subtitle1" className="font-semibold">
                    Drafts
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {drafts.length}
                  </Typography>
                </div>

                <div
                  className="space-y-2"
                  style={{ overflowY: "auto", flex: 1 }}
                >
                  {drafts.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      No drafts yet
                    </div>
                  )}

                  {drafts.map(d => (
                    <div
                      key={d.id}
                      onClick={() => loadDraft(d)}
                      className="flex items-center justify-between p-2 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer relative"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {d.image_url && (
                          <img
                            src={d.image_url}
                            alt=""
                            style={{
                              width: 66,
                              height: 100,
                              objectFit: "cover",
                              borderRadius: 6,
                              backgroundColor: "#f3f4f6"
                            }}
                          />
                        )}
                        <div className="truncate text-sm font-medium">
                          {d.title || 'Untitled draft'}
                        </div>
                      </div>

                      {/* ⋮ menu button */}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          setActiveDraftMenu(d.id);
                        }}
                      >
                        ⋮
                      </IconButton>


                      {/* Menu */}
                      {activeDraftMenu === d.id && (
                        <div
                          className="absolute right-2 top-10 z-10 bg-gray-800 border border-gray-700 rounded shadow-md"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              duplicateDraft(d.id)
                              setActiveDraftMenu(null)
                            }}
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            Duplicate
                          </button>

                          <button
                            onClick={e => {
                              e.stopPropagation()
                              deleteDraft(d.id)
                              setActiveDraftMenu(null)
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            {/* ================== END DRAFTS ================== */}
          </Paper>

          <Paper
            elevation={1}
            sx={{ borderRadius: 2 }}
            className="col-span-6 p-6"
            style={{
              height: "100%",
              overflowY: "auto"
            }}
          >

          <div className="mb-6 p-4 rounded-lg border border-gray-700 bg-gray-800">
            <div className="flex justify-between items-center mb-3">
              <Typography variant="h6" sx={{ color: "#e5e7eb" }}> Create / Schedule Pin</Typography>

              <div>
              <Button
                variant="contained"
                color={isConnected ? "success" : "primary"}
                onClick={() => {
                  if (!isConnected) {
                    window.location.href = `${BACKEND.replace(/\/$/, '')}/login`
                  }
                }}
              >
                {isConnected ? "Connected ✓" : "Connect to Pinterest"}
              </Button>
            </div>

              {/* ===== ACCOUNT SWITCHER ===== */}
              <FormControl size="small" style={{ minWidth: 220 }}>
                <Select
                  value={selectedAccountId || ""}
                  onChange={async (e) => {
                    const value = e.target.value;

                    if (value === "__add_account__") {
                      window.location.href = `${BACKEND.replace(/\/$/, "")}/login`;
                      return;
                    }

                    try {
                      // 🔥 FIX 4: tell backend which account is now active
                      await fetch(`${BACKEND}/accounts/switch`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ account_id: value }),
                      });

                      // now safely update frontend state
                      setSelectedAccountId(value);
                    } catch (err) {
                      console.error("Account switch failed:", err);
                    }
                  }}
                  displayEmpty
                  disabled={accountsLoading || (!isMobile && !isConnected)}
                  sx={{
                    color: "#e5e7eb",
                    backgroundColor: "#1f2937",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#374151",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#4b5563",
                    },
                    "&.Mui-disabled": {
                      color: "#9ca3af",
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Account
                  </MenuItem>

                  {accounts.map(acc => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </MenuItem>
                  ))}
                  {/* ✅ ADD THIS — IT DOES NOT EXIST YET */}
                  <MenuItem
                    value="__add_account__"
                    sx={{ fontStyle: "italic", color: "primary.main" }}
                  >
                    + Add another account
                  </MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>   
            <div className="grid grid-cols-12 gap-4 p-4" >
              <TextField
                label="Title"
                className="col-span-12"
                fullWidth
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />

              <TextField
                label="Description"
                multiline
                rows={3}
                className="col-span-12"
                fullWidth
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />

              <TextField
                label="URL"
                className="col-span-6"
                fullWidth
                value={form.link}
                onChange={e => setForm({ ...form, link: e.target.value })}
              />

              <div className="col-span-6 flex items-end">
                <Autocomplete
                  fullWidth
                  options={boards}
                  getOptionLabel={(option) => option?.name || ""}
                  value={boards.find(b => b.id === form.board_id) || null}
                  onChange={(e, newValue) => {
                    setForm(prev => ({
                      ...prev,
                      board_id: newValue ? newValue.id : ""
                    }));
                  }}
                  loading={boardsLoading}
                  disabled={!accountReady}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  
                  /* 🔥 DROPDOWN HEIGHT + SMOOTH SCROLL */
                  ListboxProps={{
                    style: {
                      maxHeight: 260,          // ✅ height limit
                      overflowY: "auto",
                      scrollBehavior: "smooth" // ✅ smooth scroll
                    }
                  }}

                  /* 🔥 DARK THEME DROPDOWN */
                  PaperProps={{
                    sx: {
                      backgroundColor: "#0f172a", // slate-900
                      color: "#e5e7eb",
                      border: "1px solid #1f2933",
                      mt: 0.5
                    }
                  }}
                  
                  
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select board"
                      placeholder="Type to search boards…"
                      fullWidth
                    />
                  )}
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#111827",
                      color: "#e5e7eb",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#374151",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#4b5563",
                    },
                    "& .MuiAutocomplete-popupIndicator": {
                      color: "#9ca3af",
                    },
                    "& .MuiAutocomplete-clearIndicator": {
                      color: "#9ca3af",
                    },
                  }}
                />             
              </div>

              
                <div className="col-span-12">
                  <Typography className="mb-1">Image</Typography>
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`border-2 rounded p-4 flex flex-col gap-2 transition-all ${
                      dragOver ? 'border-blue-400 bg-blue-50' : 'border-dashed border-gray-300'
                    }`}
                    style={{ minHeight: 160 }}
                  >

                    {/* ✅ IMAGE PREVIEW */}
                    {(localPreview || form.image_url) ? (
                      <div className="w-full flex items-center gap-4">
                        <img
                          key={imageKey} // 🔥 CRITICAL
                          src={localPreview ?? form.image_url}
                          alt={form.title || 'Selected pin image'}
                          style={{
                            width: 110,
                            height: 170,
                            objectFit: 'cover',
                            borderRadius: 6
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Typography variant="subtitle1" className="truncate">
                              {form.title || 'Selected image'}
                            </Typography>

                            <IconButton size="small" onClick={removeImage}>
                              <CloseIcon />
                            </IconButton>
                          </div>

                          {uploading && (
                            <LinearProgress
                              variant="determinate"
                              value={uploadProgress}
                              className="mt-2"
                            />
                          )}

                          {uploadError && (
                            <div className="text-sm text-red-600 mt-1">{uploadError}</div>
                          )}

                          <Button
                            size="small"
                            className="mt-2"
                            onClick={() => fileInputRef.current.click()}
                            startIcon={<UploadFileIcon />}
                          >
                            Replace
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* ✅ DRAG / UPLOAD UI */}
                        <Typography className="text-gray-600">
                          Drag & drop an image here, or
                        </Typography>

                        <Button
                          variant="outlined"
                          onClick={() => fileInputRef.current.click()}
                          startIcon={<UploadFileIcon />}
                        >
                          Select Image
                        </Button>

                        <Typography className="text-xs text-gray-400 mt-2">
                          JPEG, PNG. We’ll upload to backend and post via Pinterest.
                        </Typography>

                        {uploading && (
                          <LinearProgress
                            variant="determinate"
                            value={uploadProgress}
                            className="w-full mt-2"
                          />
                        )}

                        {uploadError && (
                          <div className="text-sm text-red-600 mt-1">{uploadError}</div>
                        )}
                      </>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileInputChange}
                    style={{ display: 'none' }}
                  />
                </div>           
             
             
              <div className="col-span-6">
                <Typography className="mb-1">Date</Typography>
                <TextField
                  value={selectedDate ? selectedDate.toDateString() : ''}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </div>



              <div className="col-span-6">
                <Typography className="mb-1">Time (30-min intervals)</Typography>
                  <TextField
                    select
                    value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                    fullWidth
                  >
                    {allowedTimeSlots().map(t => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
              </div>

              {/* ===== ACCOUNT REQUIRED HINT ===== */}
              {!accountReady && (
                <Typography
                  variant="caption"
                  color="error"
                  className="col-span-12 mb-2 block"
                >
                  Select an account to continue
                </Typography>
              )}

              <div className="col-span-12 mt-4 flex gap-4 items-center">
                <Button
                  variant="outlined"
                  onClick={async () => {
                    const res = await fetch(`${BACKEND}/draft`, {
                      method: "POST",
                      credentials: "include",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        ...form,
                        id: editingDraftId // 🔥 KEY LINE
                      })
                    })

                    const data = await res.json()

                    if (data.ok) {
                      setDrafts(prev => {
                        // remove old version if updating
                        const others = prev.filter(d => d.id !== data.draft.id)
                        return [data.draft, ...others]
                      })

                      setEditingDraftId(null) // 🔥 exit edit mode
                      resetForm()
                    }
                  }}
                >
                  Save to Draft
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    // Post immediately (optimistic)
                    handlePostNow({
                      title: form.title,
                      description: form.description,
                      link: form.link,
                      board_id: form.board_id,
                      image_url: form.image_url
                    })
                  }}
                  disabled={!accountReady || !hasImage || uploading}
                >
                  Post Now
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    if (!selectedTime) {
                      alert("Please select a time");
                      return;
                    }                    
                    const iso = toISO(selectedDate, selectedTime)
                    handleSchedule({
                      title: form.title,
                      description: form.description,
                      link: form.link,
                      board_id: form.board_id,
                      image_url: form.image_url,
                      scheduled_at: iso
                    })
                  }}
                  disabled={!accountReady || scheduleDisabled || submitting}
                >
                  {submitting ? 'Scheduling…' : (uploading ? `Uploading image… (${uploadProgress}%)` : 'Schedule Pin')}
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setEditingDraftId(null); // exit draft edit mode
                    resetForm();             // 🔥 clears everything
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Paper>


          <Paper
            elevation={1}
            sx={{ borderRadius: 2 }}
            className="col-span-3 p-4"
            style={{
              height: "100%",
              overflowY: "auto"
            }}
          >
            <Typography variant="h6" className="mb-4">Pin Status — {selectedDate ? selectedDate.toDateString() : ''}</Typography>
            <div className="space-y-3 pin-status-container">
              {pinsLoading && <div className="text-gray-500">Loading pins…</div>}
              {!pinsLoading && pins.length === 0 && <div className="text-gray-500">No pins scheduled</div>}
              {filteredPins.map((p, idx) => (
                <div key={p.id || p._local_key || idx} className="p-3 bg-gray-800 rounded shadow-sm flex items-start space-x-3">
                  {p.image_url ? (
                    <img
                      src={normalizeRemoteUrl(p.image_url)}
                      alt={p.title || "Pin image"}
                      style={{
                        width: 66,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 6,
                        backgroundColor: "#f3f4f6"
                      }}
                      onError={(e) => {
                        // prevent broken image icon
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 66,
                        height: 100,
                        borderRadius: 6,
                        backgroundColor: "#e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        color: "#6b7280"
                      }}
                    >
                      No Image
                    </div>
                  )}
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="truncate">
                        {/* PIN COUNT BADGE */}
                        <div className="inline-flex items-center justify-center bg-black text-white text-[10px] font-bold rounded-full px-3 py-1 mb-1">
                          Pin {p._pin_number}
                        </div>
                        {/* Title */}
                        <div className="text-sm font-medium text-gray-100 truncate">
                          {p.title || p.name || 'Untitled'}
                        </div>

                        {/* Board */}
                        <div className="text-xs text-gray-500 truncate">
                          Board:&nbsp;
                          {p.board_name || p.board || (p.owner && p.owner.username) || p.board_id || '—'}
                        </div>
                      </div>

                      {/* Right-side: status badge */}
                      <div className="ml-3 text-right flex flex-col items-end gap-2">
                        <div
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            p.status === "posted"
                              ? "bg-green-100 text-green-800"
                              : p.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {p.status === "posted"
                            ? "Posted"
                            : p.status === "failed"
                            ? "Failed"
                            : "Scheduled"}
                        </div>
                        
                        {p.status === "failed" && p.failure_reason && (
                          <div className="text-xs text-red-600 mt-1 max-w-[180px] text-right">
                            {p.failure_reason}
                          </div>
                        )}

                        {/* 🔥 DELETE BUTTON — ONLY FOR SCHEDULED */}
                        {p.status === "failed" ? (
                          <button
                            onClick={() => retryFailedPin(p)}
                            className="text-xs text-orange-600 hover:underline"
                          >
                            Retry
                          </button>
                        ) : !p._is_posted ? (
                          <>
                            <button
                              onClick={() => editScheduledPin(p)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => deleteScheduledPin(p)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Time (clickable) */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        const dt = p._scheduled_at_date || parseServerDate(p.scheduled_at) || parseServerDate(p.scheduledAt)
                        const dayOnly = toLocalDateOnly(dt)
                        if (dayOnly) setSelectedDate(dayOnly)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          const dt = p._scheduled_at_date || parseServerDate(p.scheduled_at) || parseServerDate(p.scheduledAt)
                          const dayOnly = toLocalDateOnly(dt)
                          if (dayOnly) setSelectedDate(dayOnly)
                        }
                      }}
                      className="mt-2 text-xs text-gray-500 cursor-pointer"
                      title="Click to view pins for this date"
                    >
                      {(() => {
                        const dt =
                          p._scheduled_at_date ||
                          parseServerDate(p.scheduled_at) ||
                          parseServerDate(p.scheduledAt)

                        return formatToIST(dt)                         
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Paper>
        </Box>
        )}
      </Container>
    </ThemeProvider>
  )
  }
