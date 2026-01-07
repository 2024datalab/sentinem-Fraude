import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, CircularProgress, Tooltip as MuiTooltip, Chip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { InfoOutlined as InfoIcon, TrendingUp as TrendIcon, Security as SecurityIcon, AccountBalance as BankIcon, HelpOutline as HelpIcon } from '@mui/icons-material';
import api from '../api/config';

const Overview = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/metrics').then(res => {
            setMetrics(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const kpis = [
        { label: 'Transactions Analysées', value: '12 450', color: '#00f2ea', icon: <SecurityIcon />, trend: '+5%' },
        { label: 'Alertes Haut Risque', value: '342', color: '#ff0055', icon: <TrendIcon />, trend: '+12%' },
        { label: 'Taux de Fraude Estimé', value: '2.75%', color: '#ffc107', icon: <BankIcon />, trend: '-0.5%' },
        { label: 'Volume sous Risque', value: '€452 300', color: '#ff4842', icon: <BankIcon />, trend: '+8%' },
    ];

    const riskEvolution = [
        { name: 'Lun', risk: 40, vol: 2400 },
        { name: 'Mar', risk: 30, vol: 1398 },
        { name: 'Mer', risk: 65, vol: 9800 },
        { name: 'Jeu', risk: 45, vol: 3908 },
        { name: 'Ven', risk: 90, vol: 4800 },
        { name: 'Sam', risk: 55, vol: 3800 },
        { name: 'Dim', risk: 20, vol: 4300 },
    ];

    const scoreDistribution = [
        { score: '0-0.2', count: 450, fill: '#00e676' },
        { score: '0.2-0.4', count: 120, fill: '#00f2ea' },
        { score: '0.4-0.6', count: 80, fill: '#ffb400' },
        { score: '0.6-0.8', count: 40, fill: '#ff4842' },
        { score: '0.8-1.0', count: 25, fill: '#ff0055' },
    ];

    const segmentData = [
        { segment: 'Petit (<1k)', risque: 12, label: 'Stable' },
        { segment: 'Moyen (1k-10k)', risque: 45, label: 'Vigilance' },
        { segment: 'Élevé (>10k)', risque: 88, label: 'Critique' },
    ];

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>SENTINELLE FRAUDE IA</Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)' }}>Résumé exécutif de la surveillance des transactions.</Typography>
                </Box>
                <MuiTooltip title={`Dernière mise à jour : ${new Date().toLocaleTimeString()}`}>
                    <Typography variant="caption" sx={{ opacity: 0.5, cursor: 'help' }}>SYNCHRONISÉ EN TEMPS RÉEL</Typography>
                </MuiTooltip>
            </Box>

            <Grid container spacing={4}>
                {kpis.map((kpi, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Card className={`glass-panel animate-fade-in-up stagger-${i + 1}`} sx={{ position: 'relative', overflow: 'hidden', minHeight: 140 }}>
                            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1, transform: 'scale(2.5)', color: kpi.color }}>
                                {kpi.icon}
                            </Box>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Box sx={{ color: kpi.color, mr: 1, display: 'flex' }}>{kpi.icon}</Box>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', opacity: 0.6, letterSpacing: 1.5, textTransform: 'uppercase' }}>{kpi.label}</Typography>
                                </Box>
                                <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>{kpi.value}</Typography>
                                <Chip
                                    label={`${kpi.trend} vs hier`}
                                    size="small"
                                    sx={{
                                        bgcolor: kpi.trend.startsWith('+') ? 'rgba(255, 0, 85, 0.1)' : 'rgba(0, 230, 118, 0.1)',
                                        color: kpi.trend.startsWith('+') ? '#ff0055' : '#00e676',
                                        fontWeight: 'bold',
                                        fontSize: '0.7rem'
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                <Grid item xs={12} md={8}>
                    <Paper className="glass-panel animate-fade-in-up stagger-1" sx={{ p: 4, height: 550 }}>
                        <Typography variant="h6" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>Évolution du Risque Moyen (7 jours)</Typography>
                        <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={riskEvolution}>
                                <defs>
                                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00f2ea" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#00f2ea" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ bgcolor: '#161c24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
                                <Area type="monotone" dataKey="risk" stroke="#00f2ea" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={4} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper className="glass-panel animate-fade-in-up stagger-2" sx={{ p: 4, height: 550 }}>
                        <Typography variant="h6" sx={{ mb: 4, fontWeight: 'bold', color: 'secondary.main' }}>Répartition par Segment</Typography>
                        <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={segmentData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="segment" stroke="rgba(255,255,255,0.4)" fontSize={11} axisLine={false} tickLine={false} dy={10} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ bgcolor: '#161c24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
                                <Bar dataKey="risque" radius={[6, 6, 0, 0]} barSize={40}>
                                    {segmentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.risque > 70 ? '#ff0055' : entry.risque > 30 ? '#ffb400' : '#00f2ea'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper className="glass-panel animate-fade-in-up stagger-3" sx={{ p: 4, bgcolor: 'rgba(0, 242, 234, 0.02)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                            <HelpIcon sx={{ mr: 1, color: 'primary.main' }} /> Comprendre les Variables de Risque
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 1 }}>Comportement (V1-V10)</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>Variables anonymisées représentant les modèles de navigation, la fréquence des transactions et les types d'appareils utilisés.</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" sx={{ color: 'secondary.main', mb: 1 }}>Localisation & Contexte (V11-V20)</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>Données contextuelles sur la géographie de la transaction et la conformité avec l'historique de l'utilisateur.</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" sx={{ color: 'warning.main', mb: 1 }}>Montant & Fréquence</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>Analyse des écarts types sur les montants transactionnels par rapport aux habitudes de consommation établies.</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Overview;
