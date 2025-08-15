import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Star, Zap } from 'lucide-react';

interface ScoreComparison {
  questionId: string;
  original: {
    quality: number;
    sincerity: number;
    points: number;
  };
  new: {
    quality: number;
    sincerity: number;
    points: number;
  };
  change: {
    quality: number;
    sincerity: number;
    points: number;
  };
  reasoning?: string;
}

interface ScoreComparisonProps {
  comparisons: ScoreComparison[];
  overallImprovement: {
    qualityChange: number;
    sincerityChange: number;
    pointsChange: number;
  };
  isVisible: boolean;
}

export default function ScoreComparisonDisplay({ 
  comparisons, 
  overallImprovement, 
  isVisible 
}: ScoreComparisonProps) {
  if (!isVisible || !comparisons.length) return null;

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-500";
  };

  const formatChange = (change: number, showPlus: boolean = true) => {
    if (change === 0) return "±0";
    return `${showPlus && change > 0 ? '+' : ''}${change}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 p-4 bg-background/50 rounded-lg border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-blue-500" />
        <h4 className="font-medium text-sm">Score Analysis</h4>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-card/30 rounded border">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {getChangeIcon(overallImprovement.qualityChange)}
            <span className="text-xs font-medium">Quality</span>
          </div>
          <div className={`text-sm font-bold ${getChangeColor(overallImprovement.qualityChange)}`}>
            {formatChange(overallImprovement.qualityChange)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {getChangeIcon(overallImprovement.sincerityChange)}
            <span className="text-xs font-medium">Sincerity</span>
          </div>
          <div className={`text-sm font-bold ${getChangeColor(overallImprovement.sincerityChange)}`}>
            {formatChange(overallImprovement.sincerityChange)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {getChangeIcon(overallImprovement.pointsChange)}
            <span className="text-xs font-medium">Points</span>
          </div>
          <div className={`text-sm font-bold ${getChangeColor(overallImprovement.pointsChange)}`}>
            {formatChange(overallImprovement.pointsChange)}
          </div>
        </div>
      </div>

      {/* Individual Question Breakdown */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-muted-foreground mb-2">Question-by-Question:</h5>
        {comparisons.map((comparison, index) => (
          <div key={comparison.questionId} className="p-2 bg-card/20 rounded text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Question {index + 1}</span>
              <div className="flex items-center gap-2">
                <span className={`${getChangeColor(comparison.change.points)} font-bold`}>
                  {formatChange(comparison.change.points)} pts
                </span>
                {getChangeIcon(comparison.change.points)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                Quality: {comparison.original.quality} → {comparison.new.quality}
                <span className={`ml-1 ${getChangeColor(comparison.change.quality)}`}>
                  ({formatChange(comparison.change.quality)})
                </span>
              </div>
              <div>
                Sincerity: {comparison.original.sincerity} → {comparison.new.sincerity}
                <span className={`ml-1 ${getChangeColor(comparison.change.sincerity)}`}>
                  ({formatChange(comparison.change.sincerity)})
                </span>
              </div>
            </div>
            
            {comparison.reasoning && (
              <div className="mt-1 text-xs text-muted-foreground italic">
                {comparison.reasoning}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scoring Explanation */}
      <div className="mt-3 p-2 bg-blue-50/50 rounded text-xs">
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-3 h-3 text-blue-500" />
          <span className="font-medium text-blue-700">Scoring Guide:</span>
        </div>
        <div className="text-blue-600 text-xs space-y-1">
          <div>• 9-10 avg: 500 pts (exceptional) • 7-8 avg: 400 pts (good)</div>
          <div>• 5-6 avg: 300 pts (decent) • 3-4 avg: 200 pts (minimal) • 1-2 avg: 100 pts (poor)</div>
        </div>
      </div>
    </motion.div>
  );
} 