const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');

const getAllHandler = (Model, modelName = '') =>
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObject) {
      filter = req.filterObject;
    }
    const documentsCount = await Model.countDocuments();
    const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .search(modelName)
      .sort()
      .limitFields()
      .paginate(documentsCount);

    const { mongooseQuery, paginationData } = apiFeatures;
    const documents = await mongooseQuery;

    res
      .status(200)
      .json({ results: documents.length, paginationData, data: documents });
  });

const getByIdHandler = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findById(id);
    if (!document) {
      return next(new ApiError(`No ${Model} for this id ${id}`, 404));
    }
    res.status(200).json({ data: document });
  });

const createHandler = (Model) =>
  asyncHandler(async (req, res) => {
    const newDocument = await Model.create(req.body);
    res.status(201).json({ data: newDocument });
  });

const updateHandler = (Model) =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!document) {
      return next(
        new ApiError(`No ${Model} for this id ${req.params.id}`, 404)
      );
    }
    res.status(200).json({ data: document });
  });

const deletehandler = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findByIdAndDelete(id);
    if (!document) {
      return next(new ApiError(`No ${Model} for this id ${id}`, 404));
    }
    res.status(204).send();
  });

module.exports = {
  getAllHandler,
  getByIdHandler,
  createHandler,
  updateHandler,
  deletehandler,
};
