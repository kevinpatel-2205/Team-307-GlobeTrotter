import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  Typography,
  Grid,
} from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

// CSS animations will be handled by Material-UI sx prop

function TravelAnalytics({ travelInsights }) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Enhanced Travel Patterns Timeline */}
      <Grid item xs={12}>
        <Card sx={{
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: '0 8px 16px rgba(255,107,107,0.3)'
              }}>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                  📈
                </Typography>
              </Box>
              <Box>
                <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                  Travel Patterns
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  Your adventure timeline over the past 12 months
                </Typography>
              </Box>
            </Box>

            <Box sx={{
              height: 350,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 3,
              p: 2,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={travelInsights.travelPatterns}>
                  <defs>
                    <linearGradient id="colorfulTravelGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.9}/>
                      <stop offset="25%" stopColor="#feca57" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="#48dbfb" stopOpacity={0.7}/>
                      <stop offset="75%" stopColor="#ff9ff3" stopOpacity={0.6}/>
                      <stop offset="100%" stopColor="#54a0ff" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'white', fontSize: 12, fontWeight: 'bold' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                  />
                  <YAxis
                    tick={{ fill: 'white', fontSize: 12, fontWeight: 'bold' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.5)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                    formatter={(value, name) => [
                      name === 'trips' ? `🎯 ${value} trips` : `💰 $${value}`,
                      name === 'trips' ? 'Adventures' : 'Budget Spent'
                    ]}
                    labelStyle={{ color: '#feca57', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="trips"
                    stroke="#ff6b6b"
                    fillOpacity={1}
                    fill="url(#colorfulTravelGradient)"
                    strokeWidth={3}
                    dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: '#feca57', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Card>
      </Grid>

      {/* Seasonal Preferences */}
      <Grid item xs={12}>
        <Card sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            Seasonal Preferences
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
            When you love to travel most
          </Typography>
          
          {/* Season Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {travelInsights.seasonalTrends.map((season, index) => (
              <Grid item xs={6} md={3} key={season.season}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: season.color,
                        margin: '0 auto 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {season.count}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {season.season}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {season.months}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Seasonal Chart */}
          <Box sx={{ height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={travelInsights.seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis 
                  dataKey="season" 
                  tick={{ fill: 'white', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                />
                <YAxis 
                  tick={{ fill: 'white', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value) => [`${value} trips`, 'Trips']}
                />
                <Bar 
                  dataKey="count" 
                  fill="rgba(255,255,255,0.8)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Card>
      </Grid>
    </Grid>
  );
}

export default TravelAnalytics;
