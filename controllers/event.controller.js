import { Event } from "../models/event.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addEvent = asyncHandler(async (req, res) => {
  const { eventName, eventDescription, startDate, endDate } = req.body;

  if (!eventName || !startDate) {
    throw new ApiError(400, "All fields are required");
  }

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  const user = await User.findById(userId); // Assume req.user contains the authenticated user
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  try {
    const event = await Event.create({
      eventName,
      eventDescription,
      startDate,
      endDate,
      createdBy: userId,
    });

    user.events.push(event._id);
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, event, "Event successfully registered"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getUserEvents = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId).populate("events"); // Populate to get event details

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const events = user.events;

  return res.status(200).json(new ApiResponse(200, events, "User events"));
});

const deleteEvent = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { eventId } = req.params;

  if (!eventId) {
    throw new ApiError(400, "Event Id required");
  }

  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (!event.createdBy.equals(userId)) {
    throw new ApiError(403, "Unauthorized access");
  }

  const user = await User.findById(userId);

  try {
    await Event.findByIdAndDelete(eventId);

    user.events.pull(eventId);
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Event successfully deleted"));
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const updateEvent = asyncHandler(async (req, res) => {
  const { eventName, eventDescription, startDate, endDate } = req.body;
  const { eventId } = req.params;
  const userId = req.user._id;

  if (!eventName || !startDate || !eventId) {
    throw new ApiError(400, "All fields are required");
  }

  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  try {
    const updatedEvent = await Event.findByIdAndUpdate(eventId, {
      eventName,
      eventDescription,
      startDate,
      endDate,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedEvent, "Event successfully updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

export { addEvent, getUserEvents, deleteEvent, updateEvent };
