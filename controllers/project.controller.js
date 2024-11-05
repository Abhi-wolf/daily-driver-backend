import { Project } from "../models/project.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const addProject = asyncHandler(async (req, res) => {
  const { projectId, projectName, projectDescription, projectTasks } = req.body;

  if (!projectName) {
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
    let project;
    if (projectId) {
      project = await Project.findByIdAndUpdate(projectId, {
        projectName,
        projectDescription,
      });
    } else {
      project = await Project.create({
        projectName,
        projectDescription,
        projectTasks,
        createdBy: userId,
      });

      user.projects.push(project._id);
      await user.save();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, project, "Project successfully created"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  //   const user = await User.findById(userId).populate("projects"); // Populate to get event details

  const user = await User.findById(userId)
    .populate({
      path: "projects",
      select: "projectName", // Only select the projectName field
    })
    .select("projects");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const projects = user.projects;

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId || projectId === "undefined") {
    throw new ApiError(400, "Project Id not present");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    throw new ApiError(400, "Project Id not present");
  }

  try {
    const project = await Project.findById(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // Remove project from User's 'projects' array
    await User.updateMany(
      { projects: projectId },
      { $pull: { projects: projectId } }
    );

    // Delete the project from the Project collection
    await Project.findByIdAndDelete(projectId);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Project successfully deleted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

const updateProjectTasks = asyncHandler(async (req, res) => {
  const { projectTasks } = req.body;
  const { projectId } = req.params;

  if (!projectId) {
    throw new ApiError(400, "Project id is required");
  }

  const userId = req.user._id;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (!project.createdBy.equals(userId)) {
    throw new ApiError(403, "Unauthorized access");
  }

  try {
    project.projectTasks = projectTasks;
    await project.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          project?.projectTasks,
          "Project tasks successfully updated"
        )
      );
  } catch (error) {
    console.error("ERROR = ", error);
    return res.status(500).json(new ApiError(500, "Internal error"));
  }
});

export {
  addProject,
  getProjects,
  getProject,
  deleteProject,
  updateProjectTasks,
};
