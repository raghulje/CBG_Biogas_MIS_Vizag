const { AppConfig } = require('../models');

exports.getTheme = async (req, res) => {
  try {
    const row = await AppConfig.findOne({ where: { key: 'theme' } });
    const value = row ? row.value : null;
    // Theme rarely changes — allow short browser/proxy cache
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ theme: value || 'professional' });
  } catch (err) {
    console.error('getTheme error', err);
    res.status(500).json({ message: 'Failed to read theme' });
  }
};

exports.saveTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme) return res.status(400).json({ message: 'theme is required' });
    const [row] = await AppConfig.findOrCreate({ where: { key: 'theme' }, defaults: { value: theme } });
    if (!row.isNewRecord) await row.update({ value: theme });
    res.json({ theme });
  } catch (err) {
    console.error('saveTheme error', err);
    res.status(500).json({ message: 'Failed to save theme' });
  }
};
