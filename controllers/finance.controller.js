const getFinanceSummary = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Get finance summary endpoint' });
    } catch (error) {
        next(error);
    }
};

const getTransactions = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Get transactions endpoint' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFinanceSummary,
    getTransactions
};
