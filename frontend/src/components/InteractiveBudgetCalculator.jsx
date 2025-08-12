import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  CurrencyRupee,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Edit,
  Save,
  Refresh,
  PieChart,
  BarChart,
} from '@mui/icons-material';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

const CATEGORY_COLORS = {
  flight: '#1976d2',
  hotel: '#9c27b0',
  restaurant: '#2e7d32',
  activity: '#ed6c02',
  transport: '#0288d1',
  other: '#757575',
};

function InteractiveBudgetCalculator({ 
  tripId, 
  itineraryItems = [], 
  totalBudget = 0, 
  onBudgetUpdate,
  onItemCostUpdate 
}) {
  const [budget, setBudget] = useState(totalBudget);
  const [editMode, setEditMode] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [categoryBudgets, setCategoryBudgets] = useState({
    flight: 0,
    hotel: 0,
    restaurant: 0,
    activity: 0,
    transport: 0,
    other: 0,
  });
  const [showChart, setShowChart] = useState('pie');

  useEffect(() => {
    setBudget(totalBudget);
    calculateCategoryBudgets();
  }, [totalBudget, itineraryItems]);

  const calculateCategoryBudgets = () => {
    const categoryTotals = itineraryItems.reduce((acc, item) => {
      const category = item.category || 'other';
      const cost = parseFloat(item.cost) || 0;
      acc[category] = (acc[category] || 0) + cost;
      return acc;
    }, {});

    setCategoryBudgets(categoryTotals);
  };

  const getTotalSpent = () => {
    return Object.values(categoryBudgets).reduce((sum, amount) => sum + amount, 0);
  };

  const getRemainingBudget = () => {
    return budget - getTotalSpent();
  };

  const getBudgetProgress = () => {
    return budget > 0 ? (getTotalSpent() / budget) * 100 : 0;
  };

  const getBudgetStatus = () => {
    const progress = getBudgetProgress();
    if (progress > 100) return { status: 'over', color: 'error', icon: <Warning /> };
    if (progress > 80) return { status: 'warning', color: 'warning', icon: <TrendingUp /> };
    return { status: 'good', color: 'success', icon: <CheckCircle /> };
  };

  const getPieChartData = () => {
    return Object.entries(categoryBudgets)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: amount,
        color: CATEGORY_COLORS[category],
      }));
  };

  const getBarChartData = () => {
    return Object.entries(categoryBudgets).map(([category, amount]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      spent: amount,
      budget: budget * 0.2, // Assume 20% per category as default
    }));
  };

  const handleBudgetChange = (newBudget) => {
    setBudget(newBudget);
    if (onBudgetUpdate) {
      onBudgetUpdate(newBudget);
    }
  };

  const handleCategoryBudgetChange = (category, newAmount) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: newAmount
    }));
  };

  const budgetStatus = getBudgetStatus();

  return (
    <Box>
      {/* Budget Overview Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Trip Budget
              </Typography>
              <IconButton
                color="inherit"
                onClick={() => setBudgetDialogOpen(true)}
              >
                <Edit />
              </IconButton>
            </Box>

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                    ₹{Number(budget || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Budget
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    ₹{Number(getTotalSpent() || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Spent
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: getRemainingBudget() < 0 ? '#ffcdd2' : 'inherit'
                    }}
                  >
                    ₹{Number(getRemainingBudget() || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Remaining
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Budget Progress
                </Typography>
                <Typography variant="body2">
                  {getBudgetProgress().toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(getBudgetProgress(), 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getBudgetProgress() > 100 ? '#f44336' : '#4caf50',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Status Alert */}
      <AnimatePresence>
        {getBudgetProgress() > 80 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              severity={budgetStatus.color}
              icon={budgetStatus.icon}
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={() => setBudgetDialogOpen(true)}>
                  Adjust Budget
                </Button>
              }
            >
              {budgetStatus.status === 'over'
                ? `You're over budget by ₹${Number(Math.abs(getRemainingBudget()) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}!`
                : `You're close to your budget limit. ₹${Number(getRemainingBudget() || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} remaining.`
              }
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts Section */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Spending Breakdown
                </Typography>
                <Box>
                  <Button
                    variant={showChart === 'pie' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setShowChart('pie')}
                    sx={{ mr: 1 }}
                  >
                    <PieChart />
                  </Button>
                  <Button
                    variant={showChart === 'bar' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setShowChart('bar')}
                  >
                    <BarChart />
                  </Button>
                </Box>
              </Box>

              <Box sx={{ height: 300 }}>
                {showChart === 'pie' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={getBarChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="spent" fill="#1976d2" name="Spent" />
                      <Bar dataKey="budget" fill="#e0e0e0" name="Suggested Budget" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default InteractiveBudgetCalculator;
