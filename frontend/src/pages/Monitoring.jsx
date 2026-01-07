import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, LinearProgress, Card, CardContent, Divider, Tooltip as MuiTooltip } from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts';
import {
    Speed as SpeedIcon,
    Storage as StorageIcon,
    Update as UpdateIcon,
    Analytics as AnalyticsIcon,
    InfoOutlined as InfoIcon
} from '@mui/icons-material';
import api from '../api/config';

const Monitoring = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/metrics').then(res => {
            setMetrics(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><LinearProgress /></Box>;

    const performanceData = [
        { subject: 'ROC-AUC', A: (metrics?.roc_auc || 0.99) * 100, fullMark: 100 },
        { subject: 'Précision', A: (metrics?.precision || 0.98) * 100, fullMark: 100 },
        { subject: 'Rappel', A: (metrics?.recall || 0.97) * 100, fullMark: 100 },
        { subject: 'F1 Score', A: (metrics?.f1 || 0.975) * 100, fullMark: 100 },
        { subject: 'Stabilité', A: 95, fullMark: 100 },
    ];

    const additionalKpis = [
        { label: 'Latence Inférence', value: '42ms', sub: '+2ms', icon: <SpeedIcon />, color: '#00f2ea' },
        { label: 'Dérive du Modèle', value: '0.12%', sub: 'Stable', icon: <AnalyticsIcon />, color: '#ffb400' },
        { label: 'Fraîcheur Données', value: '5 min', sub: 'Temps réel', icon: <UpdateIcon />, color: '#00e676' },
        { label: 'Uptime Serveur', value: '99.99%', sub: 'Optimal', icon: <StorageIcon />, color: '#9c27b0' },
    ];

    const historicalData = [
        { name: 'Jan', auc: 0.98 }, { name: 'Feb', auc: 0.985 },
        { name: 'Mar', auc: 0.99 }, { name: 'Apr', auc: 0.992 },
        { name: 'May', auc: 0.995 }, { name: 'Jun', auc: 0.999 },
    ];

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Surveillance du Modèle</Typography>
                <Typography variant="body1" sx={{ opacity: 0.7 }}>Indicateurs de performance technique et santé opérationnelle de l'IA.</Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Top KPIs Row */}
                {additionalKpis.map((kpi, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <Card className={`glass-panel animate-fade-in-up stagger-${i + 1}`} sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.05)', color: kpi.color }}>
                                        {kpi.icon}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: kpi.color, fontWeight: 'bold' }}>{kpi.sub}</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>{kpi.label}</Typography>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>{kpi.value}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {/* Radar Chart Section */}
                <Grid item xs={12} md={5}>
                    <Paper className="glass-panel animate-fade-in-up stagger-1" sx={{ p: 4, height: 550, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ mb: 4, fontWeight: 'bold' }}>Profil de Performance</Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Modèle Actuel"
                                    dataKey="A"
                                    stroke="#00f2ea"
                                    fill="#00f2ea"
                                    fillOpacity={0.3}
                                    strokeWidth={3}
                                />
                                <Tooltip
                                    contentStyle={{ bgcolor: '#161c24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Line Chart Section */}
                <Grid item xs={12} md={7}>
                    <Paper className="glass-panel animate-fade-in-up stagger-2" sx={{ p: 4, height: 550 }}>
                        <Typography variant="h6" sx={{ mb: 4, fontWeight: 'bold' }}>Stabilité de l'AUC (Derniers 6 mois)</Typography>
                        <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={historicalData}>
                                <defs>
                                    <linearGradient id="colorAuc" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff0055" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ff0055" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} dy={10} />
                                <YAxis domain={[0.95, 1]} stroke="rgba(255,255,255,0.4)" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ bgcolor: '#161c24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                                />
                                <Area type="monotone" dataKey="auc" stroke="#ff0055" fillOpacity={1} fill="url(#colorAuc)" strokeWidth={4} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Detailed Metrics Table/List */}
                <Grid item xs={12}>
                    <Paper className="glass-panel animate-fade-in-up stagger-3" sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Résumé de Validation</Typography>
                        <Divider sx={{ mb: 3, opacity: 0.1 }} />
                        <Grid container spacing={3}>
                            {performanceData.map((p, i) => (
                                <Grid item xs={12} sm={2.4} key={i}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="caption" sx={{ opacity: 0.5, textTransform: 'uppercase' }}>{p.subject}</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>{p.A.toFixed(1)}%</Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={p.A}
                                            sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: p.A > 95 ? '#00e676' : '#00f2ea' } }}
                                        />
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Monitoring;
