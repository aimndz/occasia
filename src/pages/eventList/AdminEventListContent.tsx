import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { getAllEvents, updateEvent } from "../../services/eventApi";
import { getAllAccounts } from "../../services/accountApi";
import { Event } from "../../types/event";
import { parseISO, format, isBefore, isAfter } from "date-fns";
import {
  CalendarX,
  Check,
  Edit,
  Ellipsis,
  Eye,
  Plus,
  Trash,
  TriangleAlert,
  X,
} from "lucide-react";
import Combobox from "../../components/ui/combobox";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Dialog, DialogTrigger } from "../../components/ui/dialog";
import Loading from "../../components/LoadingSpinner";
import EventDialogApproval from "../../components/EventDialogApproval";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarImage } from "../../components/ui/avatar";
import EventEditDialog from "./EventEditDialog";
import { getRandomDegree } from "../../utils/randomGradient";
import { toast } from "sonner";
import EventsListHeader from "./EventsListHeader";
import PaginationBar from "../../components/PaginationBar";
import { Separator } from "../../components/ui/separator";
import CustomToast from "../../components/toasts/CustomToast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/ui/tooltip";

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

const eventStatus = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

const venues = [
  { value: "all", label: "All Venues" },
  { value: "lounge hall", label: "Lounge Hall" },
  { value: "al fresco", label: "Al Fresco" },
  { value: "function hall", label: "Function Hall" },
];

function AdminEventListContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editEventData, setEditEventData] = useState<Event | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  // Pagination state
  const currentPageParam = Number(searchParams.get("page")) || 1;
  const [currentPage, setCurrentPage] = useState<number>(currentPageParam);
  const itemsPerPage = 15; // Number of items per page

  const handleEditClick = (event: Event) => {
    setEditEventData(event);
    setOpenEditDialog(true);
  };

  const navigate = useNavigate();

  const filter = searchParams.get("filter") || "all";
  const venue = searchParams.get("venue") || "all";

  const headerEvents = events.filter((event) => {
    return (
      event.deletedAt === null || event.deletedAt === "0000-01-01T00:00:00.000Z"
    );
  });

  const filteredEvents = events
    .filter((event) => {
      return (
        event.deletedAt === null ||
        event.deletedAt === "0000-01-01T00:00:00.000Z"
      );
    })
    .filter((event) => {
      const matchesFilter =
        filter === "all" || event.status.toUpperCase() === filter.toUpperCase();
      const matchesVenue =
        venue === "all" || event.venue.toLowerCase() === venue.toLowerCase();

      // Check if the event matches the search query (title, venue, status, booked by)
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.organizer ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        users
          .find((user) => user.id === event.user.id)
          ?.firstName.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        users
          .find((user) => user.id === event.user.id)
          ?.lastName.toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesFilter && matchesVenue && matchesSearch;
    })
    .map((event) => {
      return {
        ...event,
      };
    })
    .sort((a, b) => {
      // Then, sort by scheduled date (start time)
      const aStartTime = parseISO(a.startTime);
      const bStartTime = parseISO(b.startTime);
      return aStartTime.getTime() - bStartTime.getTime();
    })
    .sort((a, b) => {
      if (filter === "all") {
        if (
          a.status.toUpperCase() === "CANCELLED" &&
          b.status.toUpperCase() !== "CANCELLED"
        ) {
          return -1;
        }
      }
      return 0;
    })
    .sort((a, b) => {
      if (filter === "all") {
        if (
          a.status.toUpperCase() === "COMPLETED" &&
          b.status.toUpperCase() !== "COMPLETED"
        ) {
          return -1;
        }
      }
      return 0;
    })
    .sort((a, b) => {
      if (filter === "all") {
        if (
          a.status.toUpperCase() === "APPROVED" &&
          b.status.toUpperCase() !== "APPROVED"
        ) {
          return -1;
        }
      }
      return 0;
    })
    .sort((a, b) => {
      if (filter === "all") {
        if (
          a.status.toUpperCase() === "PENDING" &&
          b.status.toUpperCase() !== "PENDING"
        ) {
          return -1;
        }
      }
      return 0;
    });

  // Calculate paginated events
  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = filteredEvents.slice(
    indexOfFirstEvent,
    indexOfLastEvent,
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-600 border border-green-500";
      case "PENDING":
        return "bg-yellow-100 text-yellow-600 border border-yellow-500";
      case "REJECTED":
        return "bg-red-100 text-red-600 border border-red-500";
      case "CANCELLED":
        return "bg-gray-100 text-gray-600 border border-gray-500";
      case "COMPLETED":
        return "bg-blue-100 text-blue-600 border border-blue-500";
      default:
        return "bg-secondary-100 text-secondary-600 border border-secondary-500";
    }
  };

  // check for overlapping events
  const hasOverlappingEvents = (event: Event) => {
    const eventStart = parseISO(event.startTime);
    const eventEnd = parseISO(event.endTime);

    return filteredEvents.some((otherEvent) => {
      // Skip the same event and only check for events with status "PENDING" or "APPROVED" and the same venue
      if (
        otherEvent.id === event.id ||
        (otherEvent.status !== "PENDING" && otherEvent.status !== "APPROVED") ||
        otherEvent.venue !== event.venue // Check if the venue is the same
      ) {
        return false;
      }

      const otherStart = parseISO(otherEvent.startTime);
      const otherEnd = parseISO(otherEvent.endTime);

      if (isBefore(eventStart, otherEnd) && isAfter(eventEnd, otherStart)) {
        console.log(event.title, event.venue);
      }

      return (
        isBefore(eventStart, otherEnd) && isAfter(eventEnd, otherStart) // Check for overlap
      );
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, userRes] = await Promise.all([
          getAllEvents(),
          getAllAccounts(),
        ]);
        setEvents(eventRes.data);
        setUsers(userRes.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, venue, searchQuery]);

  const handleViewClick = (id: string) => {
    navigate(`/admin/dashboard/events/${id}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("page");
      params.set(key, value);
      return params;
    });
    setCurrentPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleUpdateEvent = async (id: string, updatedEvent: Event) => {
    try {
      const formData = new FormData();
      // Add all necessary fields to FormData
      formData.append("title", updatedEvent.title);
      formData.append("organizer", updatedEvent?.organizer || "");
      formData.append("description", updatedEvent.description);
      formData.append("category", updatedEvent.category);
      formData.append("date", updatedEvent.date);
      formData.append("startTime", updatedEvent.startTime);
      formData.append("endTime", updatedEvent.endTime);
      formData.append("venue", updatedEvent.venue);
      formData.append("additionalNotes", updatedEvent.additionalNotes || "");
      formData.append("additionalHours", String(updatedEvent.additionalHours));
      formData.append("status", updatedEvent.status);

      // Only append imageUrl if it exists
      if (updatedEvent.imageUrl) {
        formData.append("imageUrl", updatedEvent.imageUrl);
      }

      if (updatedEvent.deletedAt) {
        formData.append("deletedAt", updatedEvent.deletedAt);
      }

      const res = await updateEvent(id, formData);

      if (res.success) {
        toast.custom(() => (
          <CustomToast type="success" message="Event updated successfully" />
        ));

        // Update the local events state
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === id ? { ...event, ...updatedEvent } : event,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  const handleCreateClick = () => {
    navigate("/admin/dashboard/create/select-venue");
  };

  return (
    <div className="mx-auto">
      <Separator className="my-6" />
      <EventsListHeader events={headerEvents} />
      <div className="mb-6 flex items-end justify-between">
        <div className="flex gap-3">
          <Button
            className="bg-primary-100 text-secondary-900 hover:bg-primary-200"
            onClick={handleCreateClick}
          >
            <Plus /> Add Event
          </Button>
          <Combobox
            items={eventStatus}
            label=""
            value={filter}
            onChange={(value) => handleFilterChange("filter", value)}
            className="w-48"
          />
          <Combobox
            items={venues}
            label="Venue"
            value={venue}
            onChange={(value) => handleFilterChange("venue", value)}
            className="w-48"
          />
        </div>

        <div className="relative w-full max-w-96">
          <Input
            type="search"
            placeholder="Search by title, venue, status, or organized by"
            className="w-full pr-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500" />
        </div>
      </div>
      {currentEvents.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-secondary-600">
          <Table>
            <TableHeader className="bg-secondary-300 font-semibold">
              <TableRow>
                <TableHead>Event Title</TableHead>
                <TableHead>Organized by</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Date and Time</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead>Status</TableHead>
                {filter === "pending" || filter === "all" ? (
                  <TableHead>Approve/Reject</TableHead>
                ) : null}
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-secondary-100">
              {currentEvents.map((event) => {
                const randomDeg = getRandomDegree();
                return (
                  <TableRow
                    key={event.id}
                    className={
                      hasOverlappingEvents(event) &&
                      (event.status === "PENDING" ||
                        event.status === "APPROVED")
                        ? "bg-red-200 hover:bg-red-300/70"
                        : ""
                    }
                  >
                    <Link to={`/admin/dashboard/events/${event.id}`}>
                      <TableCell className="cursor-pointer transition-all duration-200 ease-in-out hover:underline">
                        <div className="flex items-center gap-2">
                          <div className="w-5">
                            {hasOverlappingEvents(event) &&
                              (event.status === "PENDING" ||
                                event.status === "APPROVED") && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <TriangleAlert className="w-5 text-red-600" />
                                  </TooltipTrigger>
                                  <TooltipContent className="rounded-lg bg-secondary-200 p-2 text-secondary-900">
                                    <p>Event overlaps with another</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                          </div>
                          <div className="h-10 w-10 overflow-hidden rounded-lg object-cover">
                            {event.imageUrl ? (
                              <img
                                src={event.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div
                                className={`relative aspect-square w-full rounded-t-lg ${randomDeg} from-primary-100/20 to-primary-100`}
                              ></div>
                            )}
                          </div>
                          <p>{event.title}</p>
                        </div>
                      </TableCell>
                    </Link>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Avatar className="flex h-8 w-8 items-center justify-center bg-secondary-600/50 text-xs">
                          {event.organizer === "" && event.user.imageUrl ? (
                            <AvatarImage
                              src={event.user?.imageUrl}
                              className="object-cover"
                            />
                          ) : event?.organizer?.trim() === "" ? (
                            "Y"
                          ) : (
                            event?.organizer?.charAt(0).toUpperCase()
                          )}
                        </Avatar>
                        <div>
                          <p>
                            {event?.organizer?.trim() === ""
                              ? event.user.firstName + " " + event.user.lastName
                              : event?.organizer}
                          </p>
                          <p className="text-xs text-secondary-800 hover:underline">
                            <a href={`mailto:${event.user.email}`}>
                              {event.user.email}
                            </a>
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.venue.replace(/\b\w/g, (char) =>
                        char.toUpperCase(),
                      )}{" "}
                    </TableCell>
                    <TableCell>
                      <p>{format(parseISO(event.date), "MMM dd yyyy ")}</p>
                      <p className="text-secondary-800">
                        {format(parseISO(event.startTime), "hh:mm a")} -{" "}
                        {format(parseISO(event.endTime), "hh:mm a")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{format(parseISO(event.createdAt), "MMM dd yyyy")}</p>
                      <p className="text-secondary-800">
                        {format(parseISO(event.createdAt), "hh:mm a")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(event.status)} w-full max-w-28 text-center`}
                      >
                        {event.status}
                      </span>
                    </TableCell>
                    <TableCell className="w-52">
                      {event.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger>
                              <Button className="w-full rounded-lg border border-red-500 bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-500">
                                <X size={20} />
                                <p>Reject</p>
                              </Button>
                            </DialogTrigger>
                            <EventDialogApproval
                              status="REJECTED"
                              event={event}
                              onUpdateEvent={async () =>
                                await handleUpdateEvent(event.id, {
                                  ...event,
                                  status: "REJECTED",
                                })
                              }
                            />
                          </Dialog>
                          <Dialog>
                            <DialogTrigger>
                              <Button className="w-full rounded-lg bg-primary-100 text-secondary-100 hover:bg-primary-200">
                                <Check size={20} />
                                <p>Approve</p>
                              </Button>
                            </DialogTrigger>
                            <EventDialogApproval
                              status="APPROVED"
                              event={event}
                              onUpdateEvent={async () =>
                                await handleUpdateEvent(event.id, {
                                  ...event,
                                  status: "APPROVED",
                                })
                              }
                            />
                          </Dialog>
                        </div>
                      )}
                      {event.status === "APPROVED" && (
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger className="w-full">
                              <Button className="w-full rounded-lg border border-secondary-700 bg-secondary-200 text-secondary-800 hover:bg-secondary-800/20">
                                <p>Cancel</p>
                              </Button>
                            </DialogTrigger>
                            <EventDialogApproval
                              status="CANCELLED"
                              event={event}
                              onUpdateEvent={async () =>
                                await handleUpdateEvent(event.id, {
                                  ...event,
                                  status: "CANCELLED",
                                })
                              }
                            />
                          </Dialog>
                          <Dialog>
                            <DialogTrigger className="w-full">
                              <Button className="w-full rounded-lg border border-secondary-700 bg-blue-200 text-secondary-800 hover:bg-blue-800/30">
                                <p>Complete</p>
                              </Button>
                            </DialogTrigger>
                            <EventDialogApproval
                              status="COMPLETED"
                              event={event}
                              onUpdateEvent={async () =>
                                await handleUpdateEvent(event.id, {
                                  ...event,
                                  status: "COMPLETED",
                                })
                              }
                            />
                          </Dialog>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Ellipsis className="w-5 cursor-pointer text-secondary-800" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewClick(event.id)}
                            >
                              <Eye className="mr-2 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditClick(event)}
                            >
                              <Edit className="mr-2 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="flex w-full items-center px-2 py-1 text-sm text-red-600 hover:bg-secondary-200/50">
                                    <Trash className="mr-2 w-4" />
                                    Delete
                                  </button>
                                </DialogTrigger>
                                <EventDialogApproval
                                  status="DELETED"
                                  event={event}
                                  onUpdateEvent={async () =>
                                    await handleUpdateEvent(event.id, {
                                      ...event,
                                      deletedAt: new Date().toISOString(),
                                    })
                                  }
                                />
                              </Dialog>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="-mt-16 flex h-[calc(100vh-200px)] items-center justify-center">
          <div>
            <CalendarX size={"100px"} className="mx-auto text-secondary-600" />
            <h3 className="text-center text-2xl font-semibold text-secondary-600">
              No events found
            </h3>
            <h3 className="mx-auto text-center text-secondary-700">{`It looks like there are no events matching the filter criteria.`}</h3>
          </div>
        </div>
      )}
      <EventEditDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        event={editEventData}
        onUpdate={(updatedEvent: Event) =>
          handleUpdateEvent(updatedEvent.id, updatedEvent)
        }
      />

      {/* Pagination */}
      <PaginationBar
        itemsPerPage={itemsPerPage}
        dataLength={filteredEvents.length}
        currentPage={currentPage}
        handleSetCurrentPage={setCurrentPage}
        handleSetSearchParams={setSearchParams}
      />
    </div>
  );
}

export default AdminEventListContent;
