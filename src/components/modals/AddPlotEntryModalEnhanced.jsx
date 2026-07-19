import React, { useMemo, useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, User, Clock, Building2, DoorOpen, Calendar } from 'lucide-react';
import { parseTimeToHour, validateScheduleHours, hourToTimeInput } from '../../services/plotScheduleService';
import { formatScheduleHour } from '../../constants/scheduleGrid';
import { formatDisplayDate } from '../../utils/academicCalendarUtils';
import { subscribeCollegeCourses } from '../../services/courseService';
import { subscribeToBuildings } from '../../services/buildingService';
import RoomScheduleViewer from '../scheduling/RoomScheduleViewer';

const COURSE_TYPES = ['Lecture', 'Laboratory']; // Only Lecture and Laboratory

export default function AddPlotEntryModalEnhanced({
  onClose,
  onSave,
  initial,
  date,
  dayLabel,
  scheduleMode = 'regular',
  dayBlockReason,
  lockTimes = false,
  deanCollege, // Dean's college code for fetching courses
  deanUid, // Dean's UID for querying room schedules
  semester = '1', // Current semester
  dayIndex, // 0-6 for Mon-Sun
}) {
  // Multi-step form state
  const [step, setStep] = useState(1); // 1: Course, 2: Teacher, 3: Type, 4: Building, 5: Room & Time
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Data loading states
  const [courses, setCourses] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingBuildings, setLoadingBuildings] = useState(true);

  // Form data
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedType, setSelectedType] = useState('Lecture');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [startTime, setStartTime] = useState(initial?.startTime || '08:00');
  const [endTime, setEndTime] = useState(initial?.endTime || '09:30');
  const [selectedDayIndex, setSelectedDayIndex] = useState(dayIndex); // Track which day user selected

  // Subscribe to courses for the Dean's college
  useEffect(() => {
    if (!deanCollege) {
      setCourses([]);
      setLoadingCourses(false);
      return undefined;
    }

    setLoadingCourses(true);
    return subscribeCollegeCourses(
      deanCollege,
      (data) => {
        // Only show courses that have assigned teachers
        const coursesWithTeachers = data.filter(c => c.assignedTeacherUid);
        setCourses(coursesWithTeachers);
        setLoadingCourses(false);
      },
      (err) => {
        console.error('Error loading courses:', err);
        setLoadingCourses(false);
      }
    );
  }, [deanCollege]);

  // Subscribe to buildings
  useEffect(() => {
    setLoadingBuildings(true);
    return subscribeToBuildings(
      (data) => {
        setBuildings(data);
        setLoadingBuildings(false);
      },
      (err) => {
        console.error('Error loading buildings:', err);
        setLoadingBuildings(false);
      }
    );
  }, []);

  // Get teachers for selected course
  const availableTeachers = useMemo(() => {
    if (!selectedCourse) return [];
    // In this design, each course has one assigned teacher
    // But we show it as a selection for consistency
    if (selectedCourse.assignedTeacherUid) {
      return [{
        uid: selectedCourse.assignedTeacherUid,
        name: selectedCourse.assignedTeacherName,
        email: selectedCourse.assignedTeacherEmail,
      }];
    }
    return [];
  }, [selectedCourse]);

  // Get rooms for selected building
  const availableRooms = useMemo(() => {
    if (!selectedBuilding) return [];
    
    const roomsByFloor = {};
    selectedBuilding.floorData.forEach(floor => {
      floor.rooms.forEach(room => {
        if (!roomsByFloor[floor.floorNumber]) {
          roomsByFloor[floor.floorNumber] = {
            label: floor.label,
            rooms: []
          };
        }
        roomsByFloor[floor.floorNumber].rooms.push(room);
      });
    });
    return roomsByFloor;
  }, [selectedBuilding]);

  const handleNext = () => {
    setError('');
    
    if (step === 1 && !selectedCourse) {
      setError('Please select a course');
      return;
    }
    if (step === 2 && !selectedTeacher) {
      setError('Please select a teacher');
      return;
    }
    if (step === 3 && !selectedType) {
      setError('Please select a type');
      return;
    }
    if (step === 4 && !selectedBuilding) {
      setError('Please select a building');
      return;
    }
    if (step === 5 && !selectedRoom) {
      setError('Please select a room');
      return;
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError('');

    if (dayBlockReason) {
      setError(dayBlockReason);
      return;
    }

    if (!selectedCourse || !selectedTeacher || !selectedType || !selectedRoom) {
      setError('Please complete all steps');
      return;
    }

    const startHour = parseTimeToHour(startTime);
    const endHour = parseTimeToHour(endTime);
    const timeCheck = validateScheduleHours(startHour, endHour);
    if (!timeCheck.valid) {
      setError(timeCheck.message);
      return;
    }

    // Convert selectedDayIndex to day name (scheduleMode = 'regular')
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayLabels = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const finalDate = scheduleMode === 'regular' ? dayNames[selectedDayIndex] : date;
    const finalDayLabel = scheduleMode === 'regular' ? dayLabels[selectedDayIndex] : dayLabel;

    setSaving(true);
    try {
      console.log('Modal: About to save with selectedDayIndex:', selectedDayIndex, 'date:', finalDate, 'dayLabel:', finalDayLabel);
      await onSave({
        date: finalDate,
        title: selectedCourse.title,
        courseCode: selectedCourse.code,
        instructor: selectedTeacher.name,
        type: selectedType,
        startHour: timeCheck.startHour,
        endHour: timeCheck.endHour,
        roomCode: selectedRoom.roomCode,
        scheduleMode,
      });
      console.log('Modal: Save completed, closing modal');
      onClose();
    } catch (err) {
      console.error('Modal: Save error:', err);
      setError(err.message || 'Failed to save schedule block.');
      setSaving(false); // Only reset saving state on error, not on success
    }
  };

  const stepTitles = [
    'Select Course',
    'Select Teacher',
    'Select Type',
    'Select Building',
    'Select Room & Set Time'
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-[1400px] max-h-[90vh] shadow-2xl flex flex-col" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-xl" style={{ color: '#7A0808' }}>
                Add Schedule Block
              </h2>
              <p className="text-xs font-medium mt-1" style={{ color: '#2B3235', opacity: 0.65 }}>
                {dayLabel} · {formatDisplayDate(date)} · {scheduleMode === 'exam' ? 'Exam calendar' : 'Regular schedule'}
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > index + 1 ? 'bg-green-500 text-white' :
                    step === index + 1 ? 'bg-[#800000] text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs font-bold hidden lg:block ${
                    step === index + 1 ? 'text-[#800000]' : 'text-gray-400'
                  }`}>
                    {title}
                  </span>
                </div>
                {index < stepTitles.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700">{error}</p>
          </div>
        )}

        {dayBlockReason && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700">{dayBlockReason}</p>
          </div>
        )}

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Step 1: Select Course */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={20} className="text-[#800000]" />
                <h3 className="font-bold text-base" style={{ color: '#2B3235' }}>
                  Select a Course
                </h3>
              </div>
              
              {loadingCourses ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-400">No courses with assigned teachers</p>
                  <p className="text-xs text-gray-500 mt-1">Add courses in College Inventory first</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => {
                        setSelectedCourse(course);
                        setSelectedTeacher(null); // Reset teacher when course changes
                      }}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selectedCourse?.id === course.id
                          ? 'border-[#800000] bg-red-50'
                          : 'border-gray-200 hover:border-[#800000] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-black text-sm text-[#800000]">{course.code}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          course.type === 'lecture' ? 'bg-blue-100 text-blue-700' :
                          course.type === 'laboratory' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {course.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mb-2">{course.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                          {course.yearLevel}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                          {course.units} units
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Teacher */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User size={20} className="text-[#800000]" />
                <h3 className="font-bold text-base" style={{ color: '#2B3235' }}>
                  Select Teacher / Instructor
                </h3>
              </div>

              {selectedCourse && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-bold text-blue-900">
                    Selected Course: {selectedCourse.code} - {selectedCourse.title}
                  </p>
                </div>
              )}
              
              {availableTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <User size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-400">No teacher assigned to this course</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableTeachers.map((teacher) => (
                    <button
                      key={teacher.uid}
                      type="button"
                      onClick={() => setSelectedTeacher(teacher)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedTeacher?.uid === teacher.uid
                          ? 'border-[#800000] bg-red-50'
                          : 'border-gray-200 hover:border-[#800000] hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-bold text-sm text-gray-900 mb-1">{teacher.name}</p>
                      <p className="text-xs text-gray-600">{teacher.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Type */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={20} className="text-[#800000]" />
                <h3 className="font-bold text-base" style={{ color: '#2B3235' }}>
                  Select Type
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {COURSE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`p-6 rounded-xl border-2 transition-all text-center ${
                      selectedType === type
                        ? 'border-[#800000] bg-red-50'
                        : 'border-gray-200 hover:border-[#800000] hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      type === 'Lecture' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <BookOpen size={24} className={type === 'Lecture' ? 'text-blue-600' : 'text-green-600'} />
                    </div>
                    <p className="font-bold text-base" style={{ color: '#2B3235' }}>{type}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Select Building */}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={20} className="text-[#800000]" />
                <h3 className="font-bold text-base" style={{ color: '#2B3235' }}>
                  Select Building
                </h3>
              </div>
              
              {loadingBuildings ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">Loading buildings...</p>
                </div>
              ) : buildings.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-400">No buildings available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {buildings.map((building) => (
                    <button
                      key={building.id}
                      type="button"
                      onClick={() => {
                        setSelectedBuilding(building);
                        setSelectedRoom(null); // Reset room when building changes
                      }}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selectedBuilding?.id === building.id
                          ? 'border-[#800000] bg-red-50'
                          : 'border-gray-200 hover:border-[#800000] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selectedBuilding?.id === building.id ? 'bg-[#800000]' : 'bg-gray-100'
                        }`}>
                          <Building2 size={20} className={selectedBuilding?.id === building.id ? 'text-white' : 'text-gray-600'} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-900 mb-1">{building.name}</p>
                          <p className="text-xs text-gray-600">
                            {building.floors} floors · {building.totalRooms} rooms
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Select Room & Set Time - Split Panel Layout */}
          {step === 5 && (
            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
              {/* LEFT PANEL: Room Selection & Time Input Form */}
              <div className="space-y-4">
                {/* Select Room Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <DoorOpen size={18} className="text-[#800000]" />
                    <h3 className="font-bold text-sm" style={{ color: '#2B3235' }}>
                      Select Room
                    </h3>
                  </div>

                  {selectedBuilding && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-bold text-blue-900">
                        Building: {selectedBuilding.name}
                      </p>
                    </div>
                  )}

                  {Object.keys(availableRooms).length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                      <DoorOpen size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-400">No rooms in this building</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {Object.keys(availableRooms).sort((a, b) => Number(a) - Number(b)).map((floorNumber) => {
                        const floor = availableRooms[floorNumber];
                        return (
                          <div key={floorNumber}>
                            <h4 className="font-bold text-[10px] text-gray-500 uppercase mb-1.5 px-1">
                              {floor.label}
                            </h4>
                            <div className="space-y-1.5">
                              {floor.rooms.map((room) => (
                                <button
                                  key={room.docId}
                                  type="button"
                                  onClick={() => setSelectedRoom(room)}
                                  disabled={room.maintenanceStatus === 'under-maintenance'}
                                  className={`w-full text-left p-2.5 rounded-lg border-2 transition-all ${
                                    selectedRoom?.docId === room.docId
                                      ? 'border-[#800000] bg-red-50 shadow-sm'
                                      : room.maintenanceStatus === 'under-maintenance'
                                      ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                      : 'border-gray-200 hover:border-[#800000] hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-bold text-sm text-gray-900">{room.roomCode}</p>
                                      <p className="text-[10px] text-gray-600">
                                        {room.type} · Cap: {room.capacity}
                                      </p>
                                    </div>
                                    {room.maintenanceStatus === 'under-maintenance' && (
                                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                                        MAINTENANCE
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Set Time Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={18} className="text-[#800000]" />
                    <h3 className="font-bold text-sm" style={{ color: '#2B3235' }}>
                      Set Time
                    </h3>
                  </div>

                  <div className="p-3 rounded-lg border-2 border-gray-200 bg-gray-50">
                    <p className="text-xs font-bold mb-3" style={{ color: '#2B3235' }}>
                      Schedule Time: {formatScheduleHour(parseTimeToHour(startTime) || 0)} – {formatScheduleHour(parseTimeToHour(endTime) || 0)}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: '#2B3235' }}>
                          Start Time
                        </label>
                        <input
                          type="time"
                          step="1800"
                          className="input-field w-full text-sm"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          disabled={!!dayBlockReason || lockTimes}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: '#2B3235' }}>
                          End Time
                        </label>
                        <input
                          type="time"
                          step="1800"
                          className="input-field w-full text-sm"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          disabled={!!dayBlockReason || lockTimes}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] font-semibold mt-2 text-gray-600">
                      💡 You can type here or drag on the schedule grid to set time
                    </p>
                  </div>
                </div>

                {/* Summary Card */}
                {selectedRoom && (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[#800000]/5 to-[#800000]/10 border border-[#800000]/20">
                    <p className="text-[10px] font-bold uppercase text-[#800000] mb-2">Selected Room</p>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-[#800000]">{selectedRoom.roomCode}</p>
                      <p className="text-xs text-gray-700">
                        {selectedBuilding?.name} · {selectedRoom.type}
                      </p>
                      <p className="text-xs text-gray-700">
                        Capacity: {selectedRoom.capacity} students
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: Weekly Schedule Viewer */}
              <div className="border-l border-gray-200 pl-6">
                <div className="mb-3">
                  <h3 className="font-bold text-base mb-1" style={{ color: '#2B3235' }}>
                    Weekly Schedule
                  </h3>
                  <p className="text-xs text-gray-600">
                    {selectedRoom 
                      ? `Room ${selectedRoom.roomCode} schedule · Click or drag to set your time`
                      : 'Select a room to view its schedule'}
                  </p>
                </div>

                {selectedRoom ? (
                  <RoomScheduleViewer
                    roomCode={selectedRoom.roomCode}
                    scheduleMode={scheduleMode}
                    semester={semester}
                    deanUid={deanUid}
                    currentTimeSlot={
                      startTime && endTime && selectedDayIndex !== undefined
                        ? {
                            day: selectedDayIndex,
                            startHour: parseTimeToHour(startTime),
                            endHour: parseTimeToHour(endTime),
                          }
                        : null
                    }
                    onTimeSelect={(day, startHour, endHour) => {
                      // Update the day and time when user drags on the grid
                      setSelectedDayIndex(day);
                      setStartTime(hourToTimeInput(startHour));
                      setEndTime(hourToTimeInput(endHour));
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <Calendar size={64} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-400">Select a room to view schedule</p>
                      <p className="text-xs text-gray-400 mt-1">The weekly schedule will appear here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Navigation Buttons */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Summary on left */}
            <div className="text-xs text-gray-600">
              {selectedCourse && (
                <p className="font-semibold">
                  {selectedCourse.code} · {selectedTeacher?.name || 'No teacher'} · {selectedType}
                  {selectedRoom && ` · ${selectedRoom.roomCode}`}
                </p>
              )}
            </div>

            {/* Buttons on right */}
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              
              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !selectedCourse) ||
                    (step === 2 && !selectedTeacher) ||
                    (step === 3 && !selectedType) ||
                    (step === 4 && !selectedBuilding)
                  }
                  className="px-6 py-2 rounded-lg text-sm font-bold bg-[#800000] text-white hover:bg-[#600000] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || !selectedRoom || !!dayBlockReason}
                  className="px-6 py-2 rounded-lg text-sm font-bold bg-[#800000] text-white hover:bg-[#600000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Schedule Block'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
