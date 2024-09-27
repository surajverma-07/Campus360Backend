import UserModel from "../../models/campus-connect-models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

const genratingAccessToken = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    const accessToken = user.genrateAccessToken();
    await user.save({ validateBeforeSave: false });

    return { accessToken };
  } catch (error) {
    throw new ApiError(500, "Error while genrating access  token");
  }
};

const options = {
  httpOnly: true,
  secure: true,
};

//User Registration
const registerUser = asyncHandler(async (req, res) => {
  //get data from user
  const {
    username,
    name,
    email,
    rollnum,
    password,
    course,
    branch_section,
    year,
    college
  } = req.body;
  //check for data availability
  if (
    !(
      username &&
      name &&
      email &&
      rollnum &&
      course &&
      branch_section &&
      year &&
      password&&college
    )
  ) {
    throw new ApiError(404, "All Fields are required for registration");
  }
  //check for existing user
  const existedUser = await UserModel.findOne({
    $or: [{ username }, { email }, { rollnum }],
  });
  if (existedUser) {
    throw new ApiError(409, "Username or Email or Roll Number Already Exist");
  }

  const profileImageLocalPath = req.file?.path;
  let profileImage;
  if (profileImageLocalPath) {
    profileImage = await uploadOnCloudinary(profileImageLocalPath);
  }
  try {
    const user = await UserModel.create({
      username,
      name,
      email,
      rollnum,
      course,
      branch_section,
      year,
      password,
      college,
      profileImage: profileImage?.secure_url || "",
    });

    const newUser = await UserModel.findById(user._id).select("-password");
    if (!newUser) {
      throw new ApiError(500, "Error while registering the user");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, {newUser}, "User Registered Successfully"));
  } catch (error) {
    return res.status(500).json({ message: "Internal server error occured" });
  }
});