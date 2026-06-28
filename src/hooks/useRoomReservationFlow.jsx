import { useState, useCallback } from 'react';
import EventTypePickerModal from '../components/modals/EventTypePickerModal';
import RoomReservationModal from '../components/modals/RoomReservationModal';

export function useRoomReservationFlow() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [eventType, setEventType] = useState(null);
  const [prefill, setPrefill] = useState({});

  const openReservation = useCallback((roomPrefill = {}) => {
    setPrefill(roomPrefill);
    setPickerOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setPickerOpen(false);
    setReservationOpen(false);
    setEventType(null);
    setPrefill({});
  }, []);

  const handleTypeSelect = (type) => {
    setEventType(type);
    setPickerOpen(false);
    setReservationOpen(true);
  };

  const modals = (
    <>
      {pickerOpen && (
        <EventTypePickerModal
          onClose={closeAll}
          onSelect={handleTypeSelect}
        />
      )}
      {reservationOpen && eventType && (
        <RoomReservationModal
          eventType={eventType}
          prefill={prefill}
          onClose={closeAll}
        />
      )}
    </>
  );

  return { openReservation, modals };
}
