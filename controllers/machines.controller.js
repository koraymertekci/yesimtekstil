const getMachines = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Get machines endpoint' });
    } catch (error) {
        next(error);
    }
};

const updateMachineStatus = async (req, res, next) => {
    try {
        res.status(200).json({ message: 'Update machine status endpoint' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMachines,
    updateMachineStatus
};
