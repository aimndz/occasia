"use client";

import { CalendarAdd } from "iconsax-react";
import EventForm from "@fullcalendar/calendar-components/eventform";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@components/ui/credenza";
import EventColoredButton from "./event-colored-button";
import { Link } from "react-router-dom";
import { useRoutePrefix } from "../../hooks/useRoutePrefix";

type ColorScheme = "red" | "blue" | "green" | "default"; // Define the ColorScheme type

type ButtonProps = {
  eventdetails: {
    title: string;
    description: string;
    colorScheme?: ColorScheme;
  };
};

function EventModal({ eventdetails }: ButtonProps) {
  const routePrefix = useRoutePrefix();

  return (
    <Credenza>
      <CredenzaTrigger className="w-full" asChild>
        <Link to={`/${routePrefix}/events/${eventdetails.id}`}>
          <EventColoredButton
            eventdetails={eventdetails}
            colorScheme={eventdetails?.colorScheme}
          />
        </Link>
      </CredenzaTrigger>

      <CredenzaContent className="max-w-5xl">
        <CredenzaHeader className="px-6 lg:px-2">
          <CredenzaTitle>
            <div className="flex items-center justify-start">
              <CalendarAdd className="h-6 w-6" color="black" strokeWidth={20} />
              <span className="ml-2">Modify Event</span>
            </div>
          </CredenzaTitle>
          <CredenzaDescription className="text-left">
            Modify the details of the event.
          </CredenzaDescription>
        </CredenzaHeader>

        {/* Make the EventModal body scrollable */}
        <CredenzaBody className="max-h-[80vh] overflow-y-auto">
          <EventForm values={eventdetails} />
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

export default EventModal;
