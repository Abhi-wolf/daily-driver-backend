import { Todo } from "../models/todo.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as Sentry from "@sentry/node";

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

  try {
    const { filter } = req.query;

    let todos = [];

    if (filter === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);

      todos = await Todo.find({
        createdBy: userId,
        dueDate: { $gte: todayStart, $lt: tomorrowStart },
      });
    } else if (filter === "this-week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));

      todos = await Todo.find({
        createdBy: userId,
        dueDate: { $gte: startOfWeek, $lte: endOfWeek },
      });
    } else if (filter === "next-week") {
      const startOfNextWeek = new Date();
      startOfNextWeek.setDate(
        startOfNextWeek.getDate() - startOfNextWeek.getDay() + 7
      );

      const endOfNextWeek = new Date(startOfNextWeek);
      endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);

      todos = await Todo.find({
        createdBy: userId,
        dueDate: {
          $gte: startOfNextWeek,
          $lte: endOfNextWeek,
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
