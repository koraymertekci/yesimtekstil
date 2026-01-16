const getSales = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Get sales endpoint' });
    } catch (error) {
        next(error);
    }
};

const createSale = async (req, res, next) => {
    try {
        res.status(201).json({ message: 'Create sale endpoint' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSales,
    createSale
};
