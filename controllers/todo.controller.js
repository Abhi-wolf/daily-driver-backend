import { Todo } from "../models/todo.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as Sentry from "@sentry/node";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";

const createTodo = asyncHandler(async (req, res) => {
  const { todoName, todoDescription, dueDate, label, priority } = req.body;

  if (!todoName || !label) {
    throw new ApiError(400, "All details are required");
  }

  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  try {
    const newTodo = await Todo.create({
      todoName,
      todoDescription,
      dueDate,
      label,
      priority,
      createdBy: userId,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, newTodo, "Todo successfully created"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getTodos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized access");
  }

  const { filter } = req.query;

  try {
    let todos = [];

    if (filter === "today") {
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());

      todos = await Todo.find({
        createdBy: userId,
        dueDate: { $gte: todayStart, $lt: todayEnd },
      });
    } else if (filter === "this-week") {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      todos = await Todo.find({
        createdBy: userId,
        dueDate: { $gte: weekStart, $lte: weekEnd },
      });
    } else if (filter === "next-week") {
      const nextWeekStart = addDays(
        startOfWeek(new Date(), { weekStartsOn: 0 }),
        7
      );
      const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 0 });

      todos = await Todo.find({
        createdBy: userId,
        dueDate: {
          $gte: nextWeekStart,
          $lte: nextWeekEnd,
        },
      });
    } else {
      const startDate = req.query?.startDate;
      const endDate = req.query?.endDate;

      if (startDate && endDate) {
        todos = await Todo.find({
          createdBy: userId,
          dueDate: {
            $gte: startDate,
            $lte: endDate,
          },
        });
      }
    }

    return res.status(200).json(new ApiResponse(200, todos, "User todos"));
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const deleteTodo = asyncHandler(async (req, res) => {
  const { todoId } = req.params;
  const userId = req.user._id;

  if (!todoId) {
    throw new ApiError(400, "Id is required");
  }

  const todo = await Todo.findById(todoId);

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  if (!todo.createdBy.equals(userId)) {
    throw new ApiError(401, "Unauthorized access");
  }

  try {
    await Todo.findByIdAndDelete(todoId);

    return res
      .status(200)
      .json(new ApiResponse(200, "Todo deleted successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const updateTodo = asyncHandler(async (req, res) => {
  const { todoId } = req.params;
  const { todoName, todoDescription, priority, dueDate, label } = req.body;
  const userId = req.user._id;

  if (!todoId) {
    throw new ApiError(400, "Id is required");
  }

  const oldTodo = await Todo.findById(todoId);

  if (!oldTodo) {
    throw new ApiError(404, "Todo not found");
  }

  if (!oldTodo.createdBy.equals(userId)) {
    throw new ApiError(401, "Unauthorized access");
  }

  try {
    const updatedTodo = await Todo.findByIdAndUpdate(todoId, {
      todoName,
      todoDescription,
      priority,
      dueDate,
      label,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTodo, "Todo deleted successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const updateTodoStatus = asyncHandler(async (req, res) => {
  const { todoId } = req.params;

  const { done } = req.body;

  if (!todoId) {
    throw new ApiError(400, "Id is required");
  }

  const todo = await Todo.findById(todoId);

  if (!todo) {
    throw new ApiError(400, "Todo not found");
  }

  try {
    const updatedTodo = await Todo.findByIdAndUpdate(todoId, { done });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTodo, "Todo deleted successfully"));
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

export { createTodo, getTodos, deleteTodo, updateTodo, updateTodoStatus };
