import { UserProfile } from "@/lib/mirror/types";
import { calculatePoints, calculateTotalPoints } from "@/lib/mirror/profile";
import { calculateBasePoints } from "@/lib/constants/points";
import { Card } from "../ui/card";
import { Info } from "lucide-react";

interface PointsBreakdownProps {
  profile: UserProfile;
}

export default function PointsBreakdown({ profile }: PointsBreakdownProps) {
  // Calculate point components
  const basePoints = calculateBasePoints(profile.isOG || false);
  const profilePoints = calculatePoints(profile);
  const sessionPoints = profile.sessionHistory?.reduce(
    (sum, session) => sum + (session.pointsEarned || 0),
    0
  ) || 0;

  const totalPoints = calculateTotalPoints(profile);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Points Breakdown</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Info className="w-4 h-4 mr-1" />
          Updated {new Date(profile.updatedAt).toLocaleString()}
        </div>
      </div>

      <div className="space-y-2">
        {/* Base Points */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div className="flex items-center">
            <span className="text-gray-600">Base Points</span>
            {profile.isOG && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                OG Member
              </span>
            )}
          </div>
          <span className="font-medium">{basePoints.toLocaleString()}</span>
        </div>

        {/* Session Points */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div className="flex items-center">
            <span className="text-gray-600">Session Points</span>
            <span className="ml-2 text-xs text-gray-400">
              ({profile.sessionHistory?.length || 0} sessions)
            </span>
          </div>
          <span className="font-medium">{sessionPoints.toLocaleString()}</span>
        </div>

        {/* Profile Points */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <div className="flex items-center">
            <span className="text-gray-600">Profile Completion</span>
          </div>
          <span className="font-medium">{profilePoints.toLocaleString()}</span>
        </div>

        {/* Total Points */}
        <div className="flex justify-between items-center py-2 mt-4 border-t-2 border-gray-200">
          <span className="font-semibold text-lg">Total Points</span>
          <span className="font-bold text-lg">{totalPoints.toLocaleString()}</span>
        </div>
      </div>

      {/* Point Sources */}
      <div className="mt-4 text-sm text-gray-500">
        <h4 className="font-medium mb-2">Point Sources:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Base points: 1,000 for all users</li>
          {profile.isOG && <li>OG bonus: 10,000 points</li>}
          <li>Session points: Earned from Mirror sessions</li>
          <li>Profile points: Social profiles & verification</li>
        </ul>
      </div>
    </Card>
  );
}
