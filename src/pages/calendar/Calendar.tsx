import { useEffect, useState } from "react";
import { newevents } from "./event";
import FullCalendar from "@fullcalendar/full-calendar";
import { getAllEvents } from "../../services/eventApi";
import { useSearchParams } from "react-router-dom";
import Combobox from "../../components/ui/combobox";

const eventStatus = [
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "completed",
    label: "Completed",
  },
];

function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState(newevents);

  const filter = searchParams.get("filter") || "approved";

  const filteredEvents = events.filter((event) => {
    switch (filter) {
      case "pending":
        return event.status === "PENDING";
      case "approved":
        return event.status === "APPROVED";
      case "cancelled":
        return event.status === "CANCELLED";
      case "completed":
        return event.status === "COMPLETED";
      case "rejected":
        return event.status === "REJECTED";
      default:
        return event.status === "APPROVED";
    }
  });

  useEffect(() => {
    if (!searchParams.get("filter")) {
      setSearchParams({ filter: "approved" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await getAllEvents();
        const data = res.data;

        setEvents(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchEvents();
  }, []);

  const handleFilterChange = (value: string) => {
    setSearchParams({ filter: value });
  };

  return (
    <div>
      <div>
        <p className="text-sm">Event Status</p>
        <Combobox
          items={eventStatus}
          label=""
          value={filter}
          onChange={handleFilterChange}
          className="mb-3"
        />
        {/* <span className="flex aspect-square h-8 items-center justify-center rounded-full border border-secondary-600 bg-secondary-100 text-xl font-medium">
          {filteredEvents.length}
        </span> */}
      </div>
      <FullCalendar events={filteredEvents} />
    </div>
  );
}

export default Calendar;
