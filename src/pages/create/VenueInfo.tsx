import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { cn } from "../../lib/utils";
import { z } from "zod";
import { TimeInput } from "@nextui-org/date-input";
import { Time } from "@internationalized/date";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { ArrowRight, CalendarIcon } from "lucide-react";
import { Calendar } from "../../components/ui/calendar";
import { Textarea } from "../../components/ui/textarea";
import Combobox from "../../components/ui/combobox";
import { useRoutePrefix } from "../../hooks/useRoutePrefix";
import { useUser } from "../../hooks/use-user";

const venue = [
  {
    value: "lounge hall",
    label: "Lounge Hall",
  },
  {
    value: "function hall",
    label: "Function Hall",
  },
  {
    value: "al fresco",
    label: "Al Fresco",
  },
];

const createFormSchema = (userRole: string) => {
  return z.object({
    title: z
      .string()
      .min(1, { message: "Event title is required" })
      .max(50, { message: "Event title should be less than 50 characters" }),
    eventImage: z
      .any()
      .refine(
        (file) =>
          !file || (file instanceof File && file.type.startsWith("image/")),
        {
          message: "File must be a valid image",
        },
      )
      .refine(
        (file) => !file || (file.size > 0 && file.size <= 5 * 1024 * 1024),
        {
          message: "File size must be less than 5 MB",
        },
      ),
    date: z
      .date()
      .refine((date) => date !== null, { message: "Date is required" })
      .refine(
        (date) => {
          // Apply the 7 days validation only for USER role
          if (userRole === "USER") {
            return (
              date >= new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
            );
          }
          return true; // Skip validation for ADMIN role
        },
        {
          message: "Event date should be at least 7 days from now",
        },
      ),
    venue: z.string().min(1, { message: "Event venue is required" }),
    organizer: z.string().refine(
      (val) => {
        // Make it required if userRole is ADMIN
        if (userRole === "ADMIN") {
          return val.length > 0;
        }
        return true;
      },
      { message: "Organizer name is required" },
    ),
    startTime: z.string().min(1, { message: "Start time is required" }),
    endTime: z.string().min(1, { message: "End time is required" }),
    category: z
      .string()
      .min(1, { message: "Event category is required" })
      .max(50, { message: "Event category should be less than 50 characters" }),
    description: z
      .string()
      .min(1, { message: "Event description is required" })
      .max(255, {
        message: "Event description should be less than 255 characters",
      }),

    additionalNotes: z.string(),
  });
};

const stringToTimeValue = (timeString: string) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return new Time(hours, minutes);
};

const timeValueToString = (time: Time) => {
  return `${time.hour.toString().padStart(2, "0")}:${time.minute
    .toString()
    .padStart(2, "0")}`;
};

const formatDateTime = (date: Date, time: string) => {
  const localDate = new Date(date);
  const [hours, minutes] = time.split(":").map(Number);

  // Combine date and time in local time zone
  localDate.setHours(hours, minutes, 0, 0);

  return localDate.toISOString();
};

const convertToLocalTime = (utcIsoString: string) => {
  const utcDate = new Date(utcIsoString);

  const utcPlus8Date = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);

  const hours = String(utcPlus8Date.getUTCHours()).padStart(2, "0");
  const minutes = String(utcPlus8Date.getUTCMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

function VenueInfo() {
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const [error, setError] = useState("");
  const location = useLocation();
  const { user } = useUser();

  const userRole = user?.role || "USER";
  const FormSchema = createFormSchema(userRole);

  const { spaceName, currentDate } = location.state || {};
  const [additionalHours, setAdditionalHours] = useState(0);

  const incrementHours = () => {
    setAdditionalHours((prevHours) => (prevHours < 10 ? prevHours + 1 : 10));
  };

  const decrementHours = () => {
    setAdditionalHours((prevHours) => (prevHours > 0 ? prevHours - 1 : 0));
  };

  const calculateEndTime = (
    date: Date,
    startTime: string,
    additionalHours: number,
  ): string => {
    const localDate = new Date(date);

    const [hours, minutes] = startTime.split(":").map(Number);

    localDate.setHours(hours, minutes, 0, 0);
    localDate.setHours(localDate.getHours() + 4 + additionalHours);

    return localDate.toISOString();
  };

  const [initialValues] = useState({
    title: "",
    eventImage: undefined,
    organizer: "",
    description: "",
    date: currentDate || new Date(),
    venue: spaceName || "",
    startTime: "00:00",
    endTime: "00:00",
    category: "",
    additionalNotes: "",
    additionalHours: 0,
  });

  const form = useForm<
    z.infer<typeof FormSchema> & { additionalHours: number }
  >({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (location.state && location.state.event) {
      const event = location.state.event;
      const updatedStartTime = parseISO(event.startTime);
      const localUpdatedStartTime = format(updatedStartTime, "HH:mm");

      const updatedEndTime = calculateEndTime(
        event.date,
        localUpdatedStartTime,
        event.additionalHours,
      );

      setAdditionalHours(event.additionalHours);

      // Set form values directly without resetting
      form.reset({
        title: event.title,
        eventImage: event.eventImage,
        organizer: event.organizer,
        description: event.description,
        date: new Date(event.date),
        venue: event.venue,
        startTime: convertToLocalTime(event.startTime),
        endTime: updatedEndTime,
        category: event.category,
        additionalNotes: event.additionalNotes,
      });
    }
  }, [location.state, form]);

  useEffect(() => {
    const updatedEndTime = calculateEndTime(
      form.getValues("date"),
      form.getValues("startTime"),
      additionalHours,
    );

    form.setValue("endTime", updatedEndTime);
  }, [form, additionalHours]);

  const handleCateringButton = async (values: z.infer<typeof FormSchema>) => {
    try {
      const event = {
        title: values.title,
        eventImage: values.eventImage,
        organizer: values.organizer,
        description: values.description,
        date: values.date.toISOString(),
        venue: values.venue,
        startTime: formatDateTime(values.date, values.startTime),
        endTime: calculateEndTime(
          values.date,
          values.startTime,
          additionalHours,
        ),
        category: values.category,
        additionalNotes: values.additionalNotes,
        additionalHours,
        spaceName,
      };

      navigate(`/${routePrefix}/create/catering`, { state: { event } });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
        console.error(error);
      }
    }
  };

  return (
    <div>
      <h2 className="mb-3 text-2xl font-medium">Event Details</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCateringButton)}>
          <section className="w-full space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., John's 25th Birthday"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        placeholder="e.g., John's 25th Birthday"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file); // Set the file in the form state
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="organizer"
              render={({ field }) => (
                <FormItem className={userRole !== "ADMIN" ? "hidden" : ""}>
                  <FormLabel>Organizer name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event category *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Birthday, Wedding, Corporate, Social Gathering"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event venue *</FormLabel>
                    <FormControl>
                      <Combobox
                        items={venue}
                        label="Select a venue"
                        value={field.value}
                        onChange={field.onChange}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <FormLabel className="mb-1 mt-2 text-nowrap">
                        Event date *
                      </FormLabel>
                      {/* <p className="text-sm italic text-gray-500">
                        ( <span className="font-medium">Tip:</span> Schedule
                        your event 1 month ahead for better approval chances. )
                      </p> */}
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "border border-secondary-600 bg-secondary-100 pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => field.onChange(date)}
                          disabled={{ before: new Date() }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-wrap gap-10">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <TimeInput
                        aria-label="Start Time"
                        value={stringToTimeValue(field.value)}
                        onChange={(time) =>
                          field.onChange(timeValueToString(time))
                        }
                        classNames={{
                          segment: "focus:bg-secondary-300",
                          inputWrapper: "hover:bg-secondary-100",
                        }}
                        className="rounded-md border border-solid border-secondary-300 bg-secondary-100"
                      />
                    </FormControl>
                    <p className="text-xs italic">*4 hours venue usage</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Additional Extra Hours</FormLabel>
                <FormControl>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Button
                      className="border border-secondary-600 bg-secondary-200 text-secondary-900 shadow-none hover:bg-secondary-300 active:bg-secondary-300"
                      type="button"
                      onClick={decrementHours}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={additionalHours}
                      readOnly
                      className="mx-3 w-full max-w-11 text-center"
                    />
                    <Button
                      className="border border-secondary-600 bg-secondary-200 text-secondary-900 shadow-none hover:bg-secondary-300 active:bg-secondary-300"
                      type="button"
                      onClick={incrementHours}
                    >
                      +
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about the event"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="mt-5 w-full space-y-5">
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Note ( Optional )</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes here"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
          {error && <FormMessage>{error}</FormMessage>}
          <div className="flex justify-end">
            <Button
              type="button"
              className="mt-5 w-full max-w-40 rounded-full bg-primary-100 px-28 font-semibold text-secondary-900 hover:bg-primary-200"
              onClick={form.handleSubmit(handleCateringButton)}
            >
              Proceed to Catering <ArrowRight />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default VenueInfo;
