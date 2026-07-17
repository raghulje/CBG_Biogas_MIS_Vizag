const { EmailTemplate } = require('../models');
const emailService = require('../services/emailService');
const auditService = require('../services/auditService');

// Get All Templates
exports.getTemplates = async (req, res) => {
    try {
        const templates = await EmailTemplate.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json(templates);
    } catch (error) {
        console.error('Get Templates Error:', error);
        res.status(500).json({ message: 'Error fetching templates', error: error.message });
    }
};

// Get Template by ID
exports.getTemplateById = async (req, res) => {
    try {
        const template = await EmailTemplate.findByPk(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        console.error('Get Template Error:', error);
        res.status(500).json({ message: 'Error fetching template', error: error.message });
    }
};

// Create Template
exports.createTemplate = async (req, res) => {
    try {
        const { name, subject, body, variables } = req.body;

        // Validation
        if (!name || !subject || !body) {
            return res.status(400).json({ message: 'Name, subject, and body are required' });
        }

        // Check if template name already exists
        const existing = await EmailTemplate.findOne({ where: { name } });
        if (existing) {
            return res.status(400).json({ message: 'Template with this name already exists' });
        }

        const template = await EmailTemplate.create({
            name,
            subject,
            body,
            variables: variables || null
        });

        await auditService.log(req.user.id, 'CREATE_EMAIL_TEMPLATE', 'EmailTemplate', template.id, null, template.toJSON(), req);

        res.status(201).json(template);
    } catch (error) {
        console.error('Create Template Error:', error);
        res.status(500).json({ message: 'Error creating template', error: error.message });
    }
};

// Update Template
exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject, body, variables } = req.body;

        const template = await EmailTemplate.findByPk(id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const oldValues = template.toJSON();

        // Check name uniqueness if changed
        if (name && name !== template.name) {
            const existing = await EmailTemplate.findOne({ where: { name } });
            if (existing) {
                return res.status(400).json({ message: 'Template with this name already exists' });
            }
        }

        await template.update({ name, subject, body, variables });

        await auditService.log(req.user.id, 'UPDATE_EMAIL_TEMPLATE', 'EmailTemplate', id, oldValues, template.toJSON(), req);

        res.json(template);
    } catch (error) {
        console.error('Update Template Error:', error);
        res.status(500).json({ message: 'Error updating template', error: error.message });
    }
};

// Delete Template
exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await EmailTemplate.findByPk(id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const oldValues = template.toJSON();

        await template.destroy();

        await auditService.log(req.user.id, 'DELETE_EMAIL_TEMPLATE', 'EmailTemplate', id, oldValues, null, req);

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete Template Error:', error);
        res.status(500).json({ message: 'Error deleting template', error: error.message });
    }
};

// Test Email
exports.testEmail = async (req, res) => {
    try {
        const { templateId, recipient, variables } = req.body;

        if (!templateId || !recipient) {
            return res.status(400).json({ message: 'Template ID and recipient are required' });
        }

        const template = await EmailTemplate.findByPk(templateId);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Replace variables in body
        const body = await emailService.replaceTemplateVariables(template.body, variables || {});

        // Send email
        const success = await emailService.sendEmail(recipient, template.subject, body);

        if (success) {
            await auditService.log(req.user.id, 'TEST_EMAIL_SENT', 'EmailTemplate', templateId, null, { recipient, variables }, req);
            res.json({ message: 'Test email sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send test email. Check email logs for details.' });
        }
    } catch (error) {
        console.error('Test Email Error:', error);
        res.status(500).json({ message: 'Error sending test email', error: error.message });
    }
};

// Preview Template (with variable replacement)
exports.previewTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { variables } = req.body;

        const template = await EmailTemplate.findByPk(id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const previewBody = await emailService.replaceTemplateVariables(template.body, variables || {});

        res.json({
            subject: template.subject,
            body: previewBody,
            originalBody: template.body,
            variables: template.variables
        });
    } catch (error) {
        console.error('Preview Template Error:', error);
        res.status(500).json({ message: 'Error previewing template', error: error.message });
    }
};

// Get Template Variables (extract from body)
exports.getTemplateVariables = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await EmailTemplate.findByPk(id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        // Extract variables from template body ({{variableName}} format)
        const regex = /{{(\w+)}}/g;
        const matches = template.body.matchAll(regex);
        const variables = [...new Set([...matches].map(match => match[1]))];

        res.json({ variables });
    } catch (error) {
        console.error('Get Variables Error:', error);
        res.status(500).json({ message: 'Error extracting variables', error: error.message });
    }
};

module.exports = exports;
