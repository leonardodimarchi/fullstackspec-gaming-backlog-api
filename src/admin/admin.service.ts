import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability } from '../common/enums/availability.enum';
import { GameStatus } from '../common/enums/game-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import {
  UserGame,
  UserGameDocument,
} from '../user-games/schemas/user-game.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserGame.name)
    private readonly userGameModel: Model<UserGameDocument>,
  ) {}

  async getStatistics() {
    const [
      totalUsers,
      adminCount,
      userCount,
      totalUserGames,
      statusAgg,
      availabilityAgg,
      playedHoursAgg,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: UserRole.ADMIN }),
      this.userModel.countDocuments({ role: UserRole.USER }),
      this.userGameModel.countDocuments(),
      this.userGameModel.aggregate<{ _id: GameStatus; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.userGameModel.aggregate<{ _id: Availability; count: number }>([
        { $match: { availability: { $ne: null } } },
        { $group: { _id: '$availability', count: { $sum: 1 } } },
      ]),
      this.userGameModel.aggregate<{
        totalPlayed: number;
        totalPlayedAll: number;
      }>([
        {
          $group: {
            _id: null,
            totalPlayed: { $sum: { $ifNull: ['$playedTime', 0] } },
            totalPlayedAll: {
              $sum: { $ifNull: ['$playedTimeForAllContent', 0] },
            },
          },
        },
      ]),
    ]);

    const userGamesByStatus = Object.values(GameStatus).reduce(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {} as Record<GameStatus, number>,
    );

    for (const item of statusAgg) {
      if (item._id) {
        userGamesByStatus[item._id] = item.count;
      }
    }

    const userGamesByAvailability = Object.values(Availability).reduce(
      (acc, availability) => {
        acc[availability] = 0;
        return acc;
      },
      {} as Record<Availability, number>,
    );

    for (const item of availabilityAgg) {
      if (item._id) {
        userGamesByAvailability[item._id] = item.count;
      }
    }

    return {
      totalUsers,
      usersByRole: {
        admin: adminCount,
        user: userCount,
      },
      totalUserGames,
      userGamesByStatus,
      userGamesByAvailability,
      totalPlayedHours: playedHoursAgg[0]?.totalPlayed ?? 0,
      totalPlayedHoursAllContent: playedHoursAgg[0]?.totalPlayedAll ?? 0,
    };
  }
}
