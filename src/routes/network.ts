import { Router, Request, Response } from 'express';
import { MyCoinNode } from '../core/MyCoinNode';

// Utility function to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function networkRoutes(node: MyCoinNode): Router {
  const router = Router();

  /**
   * Lấy thông tin network
   * GET /api/network/info
   */
  router.get('/info', (req: Request, res: Response) => {
    try {
      const p2pNetwork = node.getP2PNetwork();
      const peers = p2pNetwork.getPeers();

      res.json({
        success: true,
        network: {
          connectedPeers: peers.length,
          peers: peers.map(peer => ({
            url: peer.url,
            connected: peer.readyState === 1, // WebSocket.OPEN
            lastSeen: peer.lastSeen || null
          })),
          p2pPort: 6001, // Default P2P port
          nodeId: p2pNetwork.getNodeId()
        }
      });
    } catch (error) {
      console.error('Error getting network info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get network information',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Kết nối đến peer
   * POST /api/network/connect
   */
  router.post('/connect', (req: Request, res: Response) => {
    try {
      const { peerUrl } = req.body;

      if (!peerUrl) {
        return res.status(400).json({
          success: false,
          error: 'Peer URL is required'
        });
      }

      // Validate URL format
      const urlPattern = /^ws:\/\/[\w\.-]+:\d+$/;
      if (!urlPattern.test(peerUrl)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid peer URL format. Expected: ws://host:port'
        });
      }

      // Kiểm tra xem đã kết nối chưa
      const p2pNetwork = node.getP2PNetwork();
      const existingPeers = p2pNetwork.getPeers();
      const alreadyConnected = existingPeers.some(peer => peer.url === peerUrl);

      if (alreadyConnected) {
        return res.status(400).json({
          success: false,
          error: 'Already connected to this peer'
        });
      }

      // Thử kết nối
      try {
        node.connectToPeer(peerUrl);
        
        // Đợi một chút để kiểm tra kết nối
        setTimeout(() => {
          const updatedPeers = p2pNetwork.getPeers();
          const newPeer = updatedPeers.find(peer => peer.url === peerUrl);
          
          if (newPeer && newPeer.readyState === 1) {
            res.json({
              success: true,
              message: 'Successfully connected to peer',
              peer: {
                url: peerUrl,
                connected: true
              }
            });
          } else {
            res.status(400).json({
              success: false,
              error: 'Failed to establish connection to peer'
            });
          }
        }, 1000);
      } catch (connectError) {
        res.status(400).json({
          success: false,
          error: 'Failed to connect to peer',
          message: getErrorMessage(connectError)
        });
      }
    } catch (error) {
      console.error('Error connecting to peer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect to peer',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Ngắt kết nối peer
   * POST /api/network/disconnect
   */
  router.post('/disconnect', (req: Request, res: Response) => {
    try {
      const { peerUrl } = req.body;

      if (!peerUrl) {
        return res.status(400).json({
          success: false,
          error: 'Peer URL is required'
        });
      }

      const p2pNetwork = node.getP2PNetwork();
      const success = p2pNetwork.disconnectPeer(peerUrl);

      if (success) {
        res.json({
          success: true,
          message: 'Successfully disconnected from peer',
          peer: {
            url: peerUrl,
            connected: false
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Peer not found or already disconnected'
        });
      }
    } catch (error) {
      console.error('Error disconnecting peer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect peer',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy danh sách peers
   * GET /api/network/peers
   */
  router.get('/peers', (req: Request, res: Response) => {
    try {
      const p2pNetwork = node.getP2PNetwork();
      const peers = p2pNetwork.getPeers();

      const formattedPeers = peers.map(peer => ({
        url: peer.url,
        connected: peer.readyState === 1,
        readyState: peer.readyState,
        lastSeen: peer.lastSeen || null,
        connectionTime: peer.connectionTime || null
      }));

      res.json({
        success: true,
        peers: formattedPeers,
        totalCount: formattedPeers.length,
        connectedCount: formattedPeers.filter(p => p.connected).length
      });
    } catch (error) {
      console.error('Error getting peers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get peers',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Broadcast message đến tất cả peers
   * POST /api/network/broadcast
   */
  router.post('/broadcast', (req: Request, res: Response) => {
    try {
      const { type, data } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          error: 'Message type is required'
        });
      }

      const p2pNetwork = node.getP2PNetwork();
      const message = { type, data };
      
      p2pNetwork.broadcast(message);

      res.json({
        success: true,
        message: 'Message broadcasted to all peers',
        broadcastMessage: message,
        peerCount: p2pNetwork.getPeers().length
      });
    } catch (error) {
      console.error('Error broadcasting message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to broadcast message',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Lấy network statistics
   * GET /api/network/stats
   */
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const p2pNetwork = node.getP2PNetwork();
      const peers = p2pNetwork.getPeers();
      
      const connectedPeers = peers.filter(peer => peer.readyState === 1);
      const disconnectedPeers = peers.filter(peer => peer.readyState !== 1);

      res.json({
        success: true,
        stats: {
          totalPeers: peers.length,
          connectedPeers: connectedPeers.length,
          disconnectedPeers: disconnectedPeers.length,
          p2pPort: 6001,
          nodeId: p2pNetwork.getNodeId(),
          uptime: process.uptime(),
          networkHealth: connectedPeers.length > 0 ? 'healthy' : 'isolated'
        }
      });
    } catch (error) {
      console.error('Error getting network stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get network statistics',
        message: getErrorMessage(error)
      });
    }
  });

  /**
   * Sync blockchain với peers
   * POST /api/network/sync
   */
  router.post('/sync', (req: Request, res: Response) => {
    try {
      const p2pNetwork = node.getP2PNetwork();
      const peers = p2pNetwork.getPeers();

      if (peers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No peers connected for synchronization'
        });
      }

      // Trigger blockchain sync
      p2pNetwork.queryChainLengthMsg();

      res.json({
        success: true,
        message: 'Blockchain synchronization initiated',
        peerCount: peers.length
      });
    } catch (error) {
      console.error('Error syncing blockchain:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync blockchain',
        message: getErrorMessage(error)
      });
    }
  });

  return router;
}

