import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Slider, Button, TextField, Alert, CircularProgress, Divider, Chip } from '@mui/material';
import { PlayArrow as PlayIcon, Psychology as PsiIcon, Tune as TuneIcon } from '@mui/icons-material';
import api from '../api/config';

const Simulator = () => {
    const [formData, setFormData] = useState({
        V1: 0.1, V2: -0.5, V3: 2.5, V4: -0.1, V5: 0.1,
        V6: 0.7, V7: 0.5, V8: -0.1, V9: 0.7, V10: 0.6,
        V11: -0.2, V12: 1.1, V14: -0.5, V17: 0.8,
        Amount: 5000
    });
    const [threshold, setThreshold] = useState(0.5);
    const [results, setResults] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleRun = async () => {
        setLoading(true);
        setExplanation(null);
        setResults(null);
        try {
            const res = await api.post('/predict', { data: formData, threshold: threshold });
            setResults(res.data);

            const explRes = await api.post('/explain', {
                data: formData,
                risk_score: res.data.risk_score,
                prediction: res.data.prediction
            });
            setExplanation(explRes.data);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la simulation : " + (e.response?.data?.detail || e.message));
        } finally {
            setLoading(false);
        }
    };

    const variables = [
        { key: 'V1', label: 'V1 (Comportement A)', min: -5, max: 5 },
        { key: 'V3', label: 'V3 (Localisation)', min: -5, max: 5 },
        { key: 'V4', label: 'V4 (Fréquence)', min: -5, max: 5 },
        { key: 'V10', label: 'V10 (Montant relatif)', min: -5, max: 5 },
        { key: 'V12', label: 'V12 (Type de terminal)', min: -5, max: 5 },
        { key: 'Amount', label: 'Montant (€)', min: 0, max: 50000, step: 100 },
    ];

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Simulateur de Stratégie</Typography>
                <Typography variant="body1" sx={{ opacity: 0.7 }}>Ajustez les variables et testez l'impact des seuils de décision.</Typography>
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                    <Paper className="glass-panel" sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <TuneIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6">Paramètres & Seuil</Typography>
                        </Box>

                        <Grid container spacing={4}>
                            {variables.map((v) => (
                                <Grid item xs={12} sm={6} key={v.key}>
                                    <Box sx={{ px: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{v.label}</Typography>
                                            <Typography variant="body2" sx={{ color: 'primary.main' }}>{formData[v.key]}</Typography>
                                        </Box>
                                        <Slider
                                            value={formData[v.key]}
                                            min={v.min}
                                            max={v.max}
                                            step={v.step || 0.1}
                                            onChange={(e, val) => setFormData({ ...formData, [v.key]: val })}
                                            size="small"
                                        />
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        <Divider sx={{ my: 4, opacity: 0.1 }} />

                        <Box sx={{ px: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>Seuil de Décision (Threshold)</Typography>
                                <Typography variant="body2" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>{threshold}</Typography>
                            </Box>
                            <Slider
                                value={threshold}
                                min={0.1}
                                max={0.9}
                                step={0.05}
                                color="secondary"
                                onChange={(e, val) => setThreshold(val)}
                            />
                            <Typography variant="caption" sx={{ opacity: 0.5 }}>
                                Un seuil bas (0.2) augmente les blocages (plus de sécurité). Un seuil haut (0.8) laisse passer plus de transactions (plus de fluidité).
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                            sx={{ mt: 5, py: 2, fontWeight: 'bold', borderRadius: 2 }}
                            onClick={handleRun}
                            disabled={loading}
                        >
                            {loading ? "ANALYSE STRATÉGIQUE..." : "LANCER LA SIMULATION"}
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Box sx={{ position: 'sticky', top: 100 }}>
                        {results ? (
                            <Box>
                                <Paper className="glass-panel" sx={{ p: 4, textAlign: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="caption" sx={{ opacity: 0.6 }}>PROBABILITÉ</Typography>
                                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>CONFIANCE : {results.confidence}</Typography>
                                    </Box>
                                    <Typography variant="h1" color={results.risk_score > threshold ? "error" : "primary"} sx={{ fontWeight: 'bold', my: 2 }}>
                                        {(results.risk_score * 100).toFixed(1)}%
                                    </Typography>
                                    <Chip
                                        label={results.prediction === 1 ? "ALERTE : BLOQUÉE" : "ACCEPTÉE : VALIDÉE"}
                                        color={results.prediction === 1 ? "error" : "success"}
                                        sx={{ height: 40, px: 2, fontWeight: 'bold', fontSize: '1rem' }}
                                    />
                                </Paper>

                                {/* What-if Table */}
                                <Paper className="glass-panel" sx={{ p: 3, mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', opacity: 0.8 }}>Analyse de Robustesse (Multi-seuils)</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: results.risk_score > 0.3 ? 'rgba(255,0,0,0.05)' : 'transparent' }}>
                                        <Typography variant="body2">Si Seuil = 0.30 (Strict)</Typography>
                                        <Chip label={results.risk_score > 0.3 ? "BLOQUÉ" : "VALIDÉ"} size="small" variant="outlined" />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1 }}>
                                        <Typography variant="body2">Si Seuil = 0.50 (Standard)</Typography>
                                        <Chip label={results.risk_score > 0.5 ? "BLOQUÉ" : "VALIDÉ"} size="small" variant="outlined" />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: results.risk_score < 0.7 ? 'rgba(0,255,0,0.05)' : 'transparent' }}>
                                        <Typography variant="body2">Si Seuil = 0.70 (Souple)</Typography>
                                        <Chip label={results.risk_score > 0.7 ? "BLOQUÉ" : "VALIDÉ"} size="small" variant="outlined" />
                                    </Box>
                                </Paper>

                                {explanation && (
                                    <Alert
                                        icon={<PsiIcon fontSize="inherit" />}
                                        severity="info"
                                        sx={{
                                            bgcolor: 'rgba(0, 242, 234, 0.05)',
                                            border: '1px solid rgba(0, 242, 234, 0.3)',
                                            color: 'white',
                                            '& .MuiAlert-icon': { color: 'primary.main' }
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>Audit Expert Automatisé</Typography>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.7, mb: 2 }}>
                                            "{explanation.explanation.split('\n\n')[0]}"
                                        </Typography>
                                        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.6 }}>
                                            {explanation.explanation.indexOf('\n\n') !== -1 ? explanation.explanation.split('\n\n')[1] : ""}
                                        </Typography>
                                    </Alert>
                                )}
                            </Box>
                        ) : (
                            <Paper sx={{ p: 10, bgcolor: 'transparent', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 4 }}>
                                <Typography sx={{ opacity: 0.4 }}>Configurez les paramètres et le seuil pour simuler une décision de fraude.</Typography>
                            </Paper>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Simulator;
