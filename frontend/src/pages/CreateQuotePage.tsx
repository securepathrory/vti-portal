import { useState } from 'react';
import { Box, Typography, TextField, Checkbox, FormControlLabel, Button, Grid } from '@mui/material';
import { Speed, MoreHoriz, Security, Assignment } from '@mui/icons-material';

function CreateQuotePage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [certify, setCertify] = useState(false);
    const [understandCoverage, setUnderstandCoverage] = useState(false);
    const [understandPolicy, setUnderstandPolicy] = useState(false);
    const [understandDescriptions, setUnderstandDescriptions] = useState(false);
    const [understandUnderwriting, setUnderstandUnderwriting] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', { name, email, phone, certify, understandCoverage, understandPolicy, understandDescriptions, understandUnderwriting, agreeTerms });
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fc', fontFamily: '"Public Sans", "Noto Sans", sans-serif', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', flex: 1 }}>
                {/* Navigation Menu */}
                <Box sx={{ width: 240, bgcolor: '#f8f9fc', p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 2, borderRadius: 2, bgcolor: '#e7ecf4' }}>
                            <Speed sx={{ color: '#0d131c' }} />
                            <Typography sx={{ color: '#0d131c', fontSize: 14, fontWeight: 'medium' }}>Dashboard</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 2 }}>
                            <MoreHoriz sx={{ color: '#0d131c' }} />
                            <Typography sx={{ color: '#0d131c', fontSize: 14, fontWeight: 'medium' }}>Policies</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 2 }}>
                            <Security sx={{ color: '#0d131c' }} />
                            <Typography sx={{ color: '#0d131c', fontSize: 14, fontWeight: 'medium' }}>Claims</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 2 }}>
                            <Assignment sx={{ color: '#0d131c' }} />
                            <Typography sx={{ color: '#0d131c', fontSize: 14, fontWeight: 'medium' }}>Agents</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, px: 3, py: 2 }}>
                            <Assignment sx={{ color: '#0d131c' }} />
                            <Typography sx={{ color: '#0d131c', fontSize: 14, fontWeight: 'medium' }}>Certificates</Typography>
                        </Box>
                    </Box>
                </Box>
                {/* Main Content */}
                <Box sx={{ flex: 1, maxWidth: 960, p: 4 }}>
                    <Typography variant="h4" sx={{ color: '#0d131c', fontWeight: 'bold', mb: 3 }}>
                        Create Quote
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#0d131c', fontWeight: 'bold', mb: 2 }}>
                        Please complete the form below to receive a quote.
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            sx={{ bgcolor: '#f8f9fc', borderRadius: 2 }}
                        />
                        <TextField
                            label="Your Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            sx={{ bgcolor: '#f8f9fc', borderRadius: 2 }}
                        />
                        <TextField
                            label="Your Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            fullWidth
                            sx={{ bgcolor: '#f8f9fc', borderRadius: 2 }}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ color: '#49699c' }}>Manufacturer</Typography>
                                <Typography variant="body1" sx={{ color: '#0d131c' }}>DJI</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ color: '#49699c' }}>Model</Typography>
                                <Typography variant="body1" sx={{ color: '#0d131c' }}>Inspire 2</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ color: '#49699c' }}>Serial Number</Typography>
                                <Typography variant="body1" sx={{ color: '#0d131c' }}>1234567890</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ color: '#49699c' }}>Purchase Date</Typography>
                                <Typography variant="body1" sx={{ color: '#0d131c' }}>12/01/2021</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" sx={{ color: '#49699c' }}>Purchase Price</Typography>
                                <Typography variant="body1" sx={{ color: '#0d131c' }}>$10,000</Typography>
                            </Grid>
                        </Grid>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ color: '#49699c' }}>Financed</Typography>
                                <Typography variant="body1" sx={{ color: '#0d131c' }}>Yes</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ color: '#49699c' }}>Loan Amount</Typography>
                                <Typography variant="body1" sx={{ color: '#0d131c' }}>$2,500</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ color: '#49699c' }}>Loan Interest Rate</Typography>
                                <Typography variant="body1" sx={{ color: '#0d131c' }}>5%</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2" sx={{ color: '#49699c' }}>Loan Term</Typography>
                                <Typography variant="body1" sx={{ color: '#0d131c' }}>24 months</Typography>
                            </Grid>
                        </Grid>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControlLabel
                                control={<Checkbox checked={certify} onChange={(e) => setCertify(e.target.checked)} />}
                                label="I certify that the information provided is accurate and complete."
                            />
                            <FormControlLabel
                                control={<Checkbox checked={understandCoverage} onChange={(e) => setUnderstandCoverage(e.target.checked)} />}
                                label="I understand that coverage cannot be bound or altered until the information has been confirmed by one of our representatives."
                            />
                            <FormControlLabel
                                control={<Checkbox checked={understandPolicy} onChange={(e) => setUnderstandPolicy(e.target.checked)} />}
                                label="I understand that this is not an insurance policy and that I must pay premium and submit a signed application before coverage is effective."
                            />
                            <FormControlLabel
                                control={<Checkbox checked={understandDescriptions} onChange={(e) => setUnderstandDescriptions(e.target.checked)} />}
                                label="I understand that any coverage descriptions provided are general descriptions only and do not represent complete descriptions of all terms, conditions, and exclusions."
                            />
                            <FormControlLabel
                                control={<Checkbox checked={understandUnderwriting} onChange={(e) => setUnderstandUnderwriting(e.target.checked)} />}
                                label="I understand that coverage is subject to underwriting approval and that the premium may change based on the review."
                            />
                            <FormControlLabel
                                control={<Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />}
                                label="I agree to the terms of service and privacy policy."
                            />
                        </Box>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{
                                bgcolor: '#0d65f2',
                                color: '#f8f9fc',
                                fontWeight: 'bold',
                                fontSize: 16,
                                px: 5,
                                py: 1.5,
                                borderRadius: 2,
                                alignSelf: 'flex-start',
                            }}
                        >
                            Submit
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default CreateQuotePage;