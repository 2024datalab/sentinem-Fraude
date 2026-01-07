import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, Drawer, Divider, List, ListItem,
    ListItemText, Grid, LinearProgress, Button, Alert, Tooltip as MuiTooltip
} from '@mui/material';
import { Info as InfoIcon, Close as CloseIcon, Psychology as PsiIcon, Warning as WarningIcon, HelpOutline as HelpIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/config';

const Inbox = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedTx, setSelectedTx] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loadingExpl, setLoadingExpl] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        api.get('/transactions').then(res => {
            // Sort by risk score descending to prioritize high risk
            const sorted = [...res.data].sort((a, b) => b.risk_score - a.risk_score);
            setTransactions(sorted);
        });
    }, []);

    const handleSelect = (tx) => {
        setSelectedTx(tx);
        setDrawerOpen(true);
        setExplanation(null);
    };

    const getExplanation = async () => {
        setLoadingExpl(true);
        try {
            const res = await api.post('/explain', {
                data: selectedTx,
                risk_score: selectedTx.risk_score,
                prediction: selectedTx.prediction
            });
            setExplanation(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingExpl(false);
        }
    };

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Flux de Transactions</Typography>
                    <Typography variant="body1" sx={{ opacity: 0.7 }}>Surveillance en temps réel avec indicateurs de confiance.</Typography>
                </Box>
                <MuiTooltip title="Les transactions sont triées par score de risque décroissant.">
                    <HelpIcon sx={{ opacity: 0.5, cursor: 'help' }} />
                </MuiTooltip>
            </Box>

            <TableContainer component={Paper} className="glass-panel animate-fade-in-up">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Référence</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Montant</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Niveau de Risque</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Confiance Score</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Décision</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((tx, i) => (
                            <TableRow
                                key={i}
                                hover
                                sx={{
                                    cursor: 'pointer',
                                    bgcolor: tx.prediction === 1 ? 'rgba(255, 0, 85, 0.05)' : 'inherit',
                                }}
                                onClick={() => handleSelect(tx)}
                            >
                                <TableCell sx={{ fontFamily: 'monospace' }}>#TX-{1000 + i}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>€{tx.Amount?.toLocaleString()}</TableCell>
                                <TableCell sx={{ width: '25%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ width: '100%', mr: 2 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={tx.risk_score * 100}
                                                color={tx.risk_score > 0.7 ? "error" : tx.risk_score > 0.3 ? "warning" : "success"}
                                                sx={{ height: 6, borderRadius: 3 }}
                                            />
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 40 }}>
                                            {(tx.risk_score * 100).toFixed(0)}%
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={tx.confidence || "Moyenne"}
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            borderColor: tx.confidence === 'Élevée' ? 'success.main' : tx.confidence === 'Faible' ? 'error.main' : 'warning.main',
                                            color: tx.confidence === 'Élevée' ? 'success.main' : tx.confidence === 'Faible' ? 'error.main' : 'warning.main',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={tx.prediction === 1 ? "FRAUDE" : "LÉGITIME"}
                                        color={tx.prediction === 1 ? "error" : "success"}
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton color="primary" onClick={() => handleSelect(tx)}><InfoIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Detail Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', md: 700 }, bgcolor: '#0d1117', p: 4 } }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Audit de la Transaction</Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}><CloseIcon /></IconButton>
                </Box>

                {selectedTx && (
                    <Box>
                        {/* Audit Trail Section */}
                        <Paper sx={{ p: 3, mb: 4, bgcolor: '#161c24', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>Parcours de Décision (Audit Trail)</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Typography variant="caption" sx={{ opacity: 0.5 }}>Score Initial</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{(selectedTx.risk_score).toFixed(4)}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" sx={{ opacity: 0.5 }}>Seuil Appliqué</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>0.50</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" sx={{ opacity: 0.5 }}>Décision Finale</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: selectedTx.prediction === 1 ? 'error.main' : 'success.main' }}>
                                        {selectedTx.prediction === 1 ? 'BLOQUÉ' : 'VALIDÉ'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Score vs Threshold Viz */}
                            <Box sx={{ mt: 3, px: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" sx={{ opacity: 0.5 }}>Légitime</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.5 }}>Frauduleux</Typography>
                                </Box>
                                <Box sx={{ position: 'relative', height: 12, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                                    {/* Threshold line */}
                                    <Box sx={{ position: 'absolute', left: '50%', top: -5, bottom: -5, width: 2, bgcolor: 'rgba(255,255,255,0.3)', zIndex: 1 }}>
                                        <Typography variant="caption" sx={{ position: 'absolute', top: -15, left: -15, fontSize: '0.6rem' }}>SEUIL</Typography>
                                    </Box>
                                    {/* Score pointer */}
                                    <Box sx={{
                                        position: 'absolute',
                                        left: `${selectedTx.risk_score * 100}%`,
                                        top: -3,
                                        width: 18,
                                        height: 18,
                                        bgcolor: selectedTx.prediction === 1 ? 'error.main' : 'primary.main',
                                        borderRadius: '50%',
                                        transform: 'translateX(-50%)',
                                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                        border: '2px solid white'
                                    }} />
                                </Box>
                            </Box>
                        </Paper>

                        {/* Deviation Comparison */}
                        <Alert
                            severity={selectedTx.deviation_index > 2 ? "warning" : "info"}
                            icon={<WarningIcon />}
                            sx={{ mb: 4, bgcolor: 'rgba(255, 180, 0, 0.05)', border: '1px solid rgba(255, 180, 0, 0.2)' }}
                        >
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Ecart au Comportement Normal</Typography>
                            <Typography variant="body2">
                                Cette transaction s'écarte de <strong>{(selectedTx.deviation_index || 0).toFixed(2)}σ</strong> de la moyenne habituelle.
                                {selectedTx.deviation_index > 2 ? " Un écart significatif qui suggère un pattern atypique." : " L'écart reste dans les limites de la normale."}
                            </Typography>
                        </Alert>

                        <Divider sx={{ mb: 4 }} />

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <PsiIcon sx={{ mr: 1, color: 'primary.main' }} /> Facteurs Clés & Audit LLM
                            </Typography>

                            {!explanation ? (
                                <Button
                                    variant="outlined"
                                    startIcon={<PsiIcon />}
                                    fullWidth
                                    onClick={getExplanation}
                                    sx={{ py: 3, borderRadius: 2 }}
                                >
                                    {loadingExpl ? "CONSULTATION DU JOURNAL..." : "GÉNÉRER L'EXPLICATION EXPERTE"}
                                </Button>
                            ) : (
                                <Box>
                                    <Box sx={{ height: 300, mb: 4 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={explanation.top_features}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="feature" type="category" width={80} stroke="rgba(255,255,255,0.7)" fontSize={12} />
                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ bgcolor: '#161c24', border: 'none' }} />
                                                <Bar dataKey="value" fill="#00f2ea" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>

                                    <Paper sx={{ p: 3, bgcolor: 'rgba(0, 242, 234, 0.05)', border: '1px solid rgba(0, 242, 234, 0.2)' }}>
                                        <Typography variant="body1" sx={{ fontStyle: 'italic', lineHeight: 1.8 }}>
                                            "{explanation.explanation.split('\n\n')[0]}"
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mt: 3, opacity: 0.5 }}>
                                            {explanation.explanation.indexOf('\n\n') !== -1 ? explanation.explanation.split('\n\n')[1] : ""}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Drawer>
        </Box>
    );
};

export default Inbox;
