const getStocks = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Get stocks endpoint' });
    } catch (error) {
        next(error);
    }
};

const getStockById = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Get stock by id endpoint' });
    } catch (error) {
        next(error);
    }
};

const createStock = async (req, res, next) => {
    try {
        res.status(201).json({ message: 'Create stock endpoint' });
    } catch (error) {
        next(error);
    }
};

const updateStock = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Update stock endpoint' });
    } catch (error) {
        next(error);
    }
};

const deleteStock = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Delete stock endpoint' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStocks,
    getStockById,
    createStock,
    updateStock,
    deleteStock
};
