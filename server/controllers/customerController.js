const { Customer } = require('../models');
const { Op } = require('sequelize');

// Convert empty strings to null so Sequelize validators (e.g. isEmail) don't reject them
const sanitize = (v) => (v === '' || v === undefined ? null : v);

exports.createCustomer = async (req, res) => {
    try {
        const { name, type, email, phone, address, gst_number, pan_number, status } = req.body;
        const customer = await Customer.create({
            name,
            type: sanitize(type),
            email: sanitize(email),
            phone: sanitize(phone),
            address: sanitize(address),
            gst_number: sanitize(gst_number),
            pan_number: sanitize(pan_number),
            status: status || 'active'
        });
        res.status(201).json(customer);
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(400).json({ message: 'Error creating customer', error: error.message });
    }
};

exports.getCustomers = async (req, res) => {
    try {
        const { search, status, type } = req.query;
        let where = {};
        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }
        if (status) {
            where.status = status;
        }
        if (type) {
            where.type = type;
        }

        const customers = await Customer.findAll({
            where,
            order: [['created_at', 'DESC']]
        });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching customers', error: error.message });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching customer', error: error.message });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        await customer.update(req.body);
        res.json(customer);
    } catch (error) {
        res.status(400).json({ message: 'Error updating customer', error: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        await customer.destroy(); // Soft delete due to paranoid: true
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting customer', error: error.message });
    }
};
