const snarkjs = require('snarkjs');
const fsPromises = require('fs').promises;
const path =require('path');
const zkService = require('./zkService'); // Import the actual module

// Mock external dependencies
jest.mock('snarkjs', () => ({
  groth16: {
    verify: jest.fn(),
    fullProve: jest.fn(),
  },
}));

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      readFile: jest.fn(),
      readdir: jest.fn(),
      access: jest.fn(),
    },
  };
});

describe('zkService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('verifyProof', () => {
    const mockVerifierKey = { vk: 'key' };
    const mockPublicSignals = [1, 2];
    const mockProof = { pi_a: [], pi_b: [], pi_c: [] };

    it('should return true when snarkjs.groth16.verify returns true', async () => {
      snarkjs.groth16.verify.mockResolvedValue(true);
      const result = await zkService.verifyProof(mockVerifierKey, mockPublicSignals, mockProof);
      expect(result).toBe(true);
      expect(snarkjs.groth16.verify).toHaveBeenCalledWith(mockVerifierKey, mockPublicSignals, mockProof);
    });

    it('should return false when snarkjs.groth16.verify returns false', async () => {
      snarkjs.groth16.verify.mockResolvedValue(false);
      const result = await zkService.verifyProof(mockVerifierKey, mockPublicSignals, mockProof);
      expect(result).toBe(false);
    });

    it('should return false and log error when snarkjs.groth16.verify throws an error', async () => {
      const error = new Error('Verification failed');
      snarkjs.groth16.verify.mockRejectedValue(error);
      const result = await zkService.verifyProof(mockVerifierKey, mockPublicSignals, mockProof);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error verifying ZK proof:', error);
    });
  });

  describe('getVerificationKey', () => {
    const circuitName = 'test_circuit';
    const expectedFilePath = path.resolve(__dirname, '..', 'zk_keys', `${circuitName}.vkey.json`);
    const mockKeyData = { key: 'data' };

    it('should retrieve and parse the verification key successfully', async () => {
      fsPromises.readFile.mockResolvedValue(JSON.stringify(mockKeyData));
      const result = await zkService.getVerificationKey(circuitName);
      expect(result).toEqual(mockKeyData);
      expect(fsPromises.readFile).toHaveBeenCalledWith(expectedFilePath, 'utf8');
    });

    it('should return null and log error if the key file does not exist', async () => {
      const error = new Error('File not found'); error.code = 'ENOENT';
      fsPromises.readFile.mockRejectedValue(error);
      const result = await zkService.getVerificationKey(circuitName);
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(`Error reading or parsing verification key for circuit ${circuitName}:`, error);
    });

    it('should return null and log error if the key file contains invalid JSON', async () => {
      fsPromises.readFile.mockResolvedValue('invalid json');
      const result = await zkService.getVerificationKey(circuitName);
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(`Error reading or parsing verification key for circuit ${circuitName}:`, expect.any(SyntaxError));
    });
  });

  describe('verifyIdentity', () => {
    const mockIdentityProof = { proof: { pi_a: ['valid_proof'] }, publicSignals: [1, 2] };
    const mockInvalidIdentityProof = { proof: { pi_a: ['invalid_proof'] }, publicSignals: [1, 2] };
    const mockVerificationKeyData = { key: 'identity_key_data' };
    const identityCircuitPath = path.resolve(__dirname, '..', 'zk_keys', 'identity_circuit.vkey.json');

    it('should successfully verify identity', async () => {
      fsPromises.readFile.mockImplementation(filePath => {
        if (filePath === identityCircuitPath) {
          return Promise.resolve(JSON.stringify(mockVerificationKeyData));
        }
        return Promise.reject(new Error('File not found in mock'));
      });
      snarkjs.groth16.verify.mockResolvedValue(true);
      
      const result = await zkService.verifyIdentity(mockIdentityProof);
      
      expect(fsPromises.readFile).toHaveBeenCalledWith(identityCircuitPath, 'utf8');
      expect(snarkjs.groth16.verify).toHaveBeenCalledWith(mockVerificationKeyData, mockIdentityProof.publicSignals, mockIdentityProof.proof);
      expect(result).toEqual({ valid: true, attributes: { membershipValid: true, communityRole: 'member' } });
    });

    it('should return error if getVerificationKey fails (file read error)', async () => {
      fsPromises.readFile.mockRejectedValue(new Error('Failed to read key'));
      const result = await zkService.verifyIdentity(mockIdentityProof);
      expect(result).toEqual({ valid: false, error: 'Failed to retrieve verification key' });
      expect(snarkjs.groth16.verify).not.toHaveBeenCalled();
    });
    
    it('should return error if verifyProof fails (snarkjs returns false)', async () => {
      fsPromises.readFile.mockResolvedValue(JSON.stringify(mockVerificationKeyData));
      snarkjs.groth16.verify.mockResolvedValue(false);
      const result = await zkService.verifyIdentity(mockInvalidIdentityProof);
      expect(result).toEqual({ valid: false, error: 'Invalid identity proof' });
    });

    it('should return error for invalid identityProof structure (e.g., missing proof)', async () => {
      // Mock readFile because getVerificationKey is called before the structure check.
      // The exact return value of readFile doesn't matter as much as the function returning the correct error.
      fsPromises.readFile.mockResolvedValue(JSON.stringify(mockVerificationKeyData)); 

      const result = await zkService.verifyIdentity({ publicSignals: [1,2] }); // Missing proof
      expect(result).toEqual({ valid: false, error: 'Invalid identityProof structure' });
      expect(snarkjs.groth16.verify).not.toHaveBeenCalled();
    });
  });

  describe('verifyAnonymousVote', () => {
    const mockVoteProof = { proof: { pi_a: ['valid_vote_proof'] }, publicSignals: [1, 2, 3] };
    const mockInvalidVoteProof = { proof: { pi_a: ['invalid_vote_proof'] }, publicSignals: [1, 2, 3] };
    const mockVerificationKeyData = { key: 'vote_key_data' };
    const voteCircuitPath = path.resolve(__dirname, '..', 'zk_keys', 'anonymous_vote_circuit.vkey.json');
    const proposalId = 'prop123';

    it('should successfully verify anonymous vote', async () => {
      fsPromises.readFile.mockImplementation(filePath => {
        if (filePath === voteCircuitPath) {
          return Promise.resolve(JSON.stringify(mockVerificationKeyData));
        }
        return Promise.reject(new Error('File not found in mock'));
      });
      snarkjs.groth16.verify.mockResolvedValue(true);

      const result = await zkService.verifyAnonymousVote(mockVoteProof, proposalId);
      expect(fsPromises.readFile).toHaveBeenCalledWith(voteCircuitPath, 'utf8');
      expect(snarkjs.groth16.verify).toHaveBeenCalledWith(mockVerificationKeyData, mockVoteProof.publicSignals, mockVoteProof.proof);
      expect(result).toEqual({ valid: true, eligible: true, notDuplicate: true });
    });

    it('should return error if getVerificationKey fails (file read error)', async () => {
      fsPromises.readFile.mockRejectedValue(new Error('Failed to read key'));
      const result = await zkService.verifyAnonymousVote(mockVoteProof, proposalId);
      expect(result).toEqual({ valid: false, error: 'Failed to retrieve verification key' });
      expect(snarkjs.groth16.verify).not.toHaveBeenCalled();
    });

    it('should return error if verifyProof fails (snarkjs returns false)', async () => {
      fsPromises.readFile.mockResolvedValue(JSON.stringify(mockVerificationKeyData));
      snarkjs.groth16.verify.mockResolvedValue(false);
      const result = await zkService.verifyAnonymousVote(mockInvalidVoteProof, proposalId);
      expect(result).toEqual({ valid: false, error: 'Invalid vote proof' });
    });
    
    it('should return error for invalid voteProof structure (e.g., missing proof)', async () => {
      // Mock readFile as getVerificationKey is called before structure check.
      fsPromises.readFile.mockResolvedValue(JSON.stringify(mockVerificationKeyData));

      const result = await zkService.verifyAnonymousVote({ publicSignals: [1,2] }, proposalId); // Missing proof
      expect(result).toEqual({ valid: false, error: 'Invalid voteProof structure' });
      expect(snarkjs.groth16.verify).not.toHaveBeenCalled();
    });
  });

  describe('getAvailableCircuits', () => {
    const zkKeysDirPath = path.resolve(__dirname, '..', 'zk_keys');
    it('should list available circuits', async () => {
      fsPromises.readdir.mockResolvedValue(['id_circuit.vkey.json', 'vote_circuit.vkey.json', 'other.txt']);
      const result = await zkService.getAvailableCircuits();
      expect(result).toEqual([
        { id: 'id_circuit', name: 'Id Circuit', description: 'Placeholder description for Id Circuit', status: 'available' },
        { id: 'vote_circuit', name: 'Vote Circuit', description: 'Placeholder description for Vote Circuit', status: 'available' },
      ]);
      expect(fsPromises.readdir).toHaveBeenCalledWith(zkKeysDirPath);
    });
    it('should return empty array if directory does not exist', async () => {
      const error = new Error('Not found'); error.code = 'ENOENT';
      fsPromises.readdir.mockRejectedValue(error);
      const result = await zkService.getAvailableCircuits();
      expect(result).toEqual([]);
    });
    it('should return empty array if directory is empty', async () => {
      fsPromises.readdir.mockResolvedValue([]);
      const result = await zkService.getAvailableCircuits();
      expect(result).toEqual([]);
    });
  });

  describe('generateProof', () => {
    const circuitId = 'test_circuit';
    const privateInputs = { a: 1 };
    const publicInputsToReturn = ['pub1'];
    const mockGeneratedProof = { proof: {}, publicSignals: ['sig1'] };
    const wasmPath = path.resolve(__dirname, '..', 'zk_keys', `${circuitId}.wasm`);
    const zkeyPath = path.resolve(__dirname, '..', 'zk_keys', `${circuitId}.zkey`);

    it('should generate proof successfully', async () => {
      fsPromises.access.mockResolvedValue(undefined); // Files exist
      snarkjs.groth16.fullProve.mockResolvedValue(mockGeneratedProof);
      const result = await zkService.generateProof(circuitId, privateInputs, publicInputsToReturn);
      expect(result).toEqual({ proof: mockGeneratedProof.proof, publicSignals: publicInputsToReturn });
      expect(fsPromises.access).toHaveBeenCalledWith(wasmPath);
      expect(fsPromises.access).toHaveBeenCalledWith(zkeyPath);
      expect(snarkjs.groth16.fullProve).toHaveBeenCalledWith(privateInputs, wasmPath, zkeyPath);
    });
    it('should return null if WASM/ZKEY files are missing', async () => {
      fsPromises.access.mockRejectedValue(new Error('File not found'));
      const result = await zkService.generateProof(circuitId, privateInputs, publicInputsToReturn);
      expect(result).toBeNull();
      expect(snarkjs.groth16.fullProve).not.toHaveBeenCalled();
    });
    it('should return null if snarkjs.groth16.fullProve throws', async () => {
      fsPromises.access.mockResolvedValue(undefined);
      snarkjs.groth16.fullProve.mockRejectedValue(new Error('Prove error'));
      const result = await zkService.generateProof(circuitId, privateInputs, publicInputsToReturn);
      expect(result).toBeNull();
    });
  });
});
